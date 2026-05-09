'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
    Users, UserCheck, GraduationCap, ClipboardList, Wallet, DollarSign, Target,
    PlusCircle, UserPlus, UploadCloud, Eye, AlertCircle,
    ChevronRight, Calendar, BookOpen, BarChart3, MessagesSquare, Award, Clock, BrainCircuit, Zap,
    TrendingUp, Shield, Activity, Fingerprint, Layout, Sparkles, Database,
    ArrowUpRight, ArrowDownRight, Globe, Cpu, Loader2
} from 'lucide-react'
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts'
import Link from 'next/link'

const COLORS = {
    primary: '#004B93',
    primaryGradient: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)',
    success: '#1FAC63',
    warning: '#F0A026',
    danger: '#EF4444',
    slate: '#64748B',
    background: '#F8FAFC',
    border: '#E2E8F0'
}

// ── SUB-VIEWS ─────────────────────────────────────────────────────────────

function KPICard({ label, val, icon: Icon, color, bg, trend }: any) {
    return (
        <div className="hover-card" style={{ background: '#FFF', padding: 32, borderRadius: 28, border: '1px solid #F1F5F9', boxShadow: '0 4px 15px rgba(0,0,0,0.01)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ padding: 10, background: bg, borderRadius: 14 }}>
                    <Icon size={22} color={color} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 1000, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontSize: 32, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>{val}</div>
                {trend && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 900, color: COLORS.success }}>
                         <ArrowUpRight size={14} /> {trend}
                    </div>
                )}
            </div>
            <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.03 }}>
                <Icon size={120} color={color} />
            </div>
        </div>
    )
}

function ParentDashboardView({ data }: { data: any }) {
    const { kpi, upcoming_exams, subject_mastery } = data
    return (
        <div style={{ animation: 'float 0.4s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
                <KPICard label="Average Score" val={kpi.avg_score + '%'} icon={Award} color={COLORS.primary} bg={`${COLORS.primary}10`} trend="+2.4%" />
                <KPICard label="Exams Completed" val={kpi.completed_exams} icon={UserCheck} color={COLORS.success} bg={`${COLORS.success}10`} />
                <KPICard label="Upcoming Exams" val={kpi.pending_exams} icon={Clock} color={COLORS.warning} bg={`${COLORS.warning}10`} />
                <KPICard label="Study Status" val="EXCELLENT" icon={Zap} color="#8B5CF6" bg="#8B5CF610" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
                <div style={{ background: '#FFF', padding: 40, borderRadius: 36, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A' }}>Upcoming Exam Timetable</h3>
                        <Link href="/dashboard/student/exams" style={{ fontSize: 13, fontWeight: 1000, color: COLORS.primary, textDecoration: 'none' }}>View All →</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {upcoming_exams.map((ex: any) => (
                            <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 24, background: '#F8FAFC', borderRadius: 24, border: '1px solid #F1F5F9' }}>
                                <div style={{ width: 56, height: 56, background: '#FFF', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                                    <Calendar size={24} color={COLORS.primary} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 16, fontWeight: 1000, color: '#1E293B' }}>{ex.name}</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginTop: 4 }}>{ex.subject} • School Level</div>
                                </div>
                                <div style={{ padding: '8px 16px', background: `${COLORS.primary}10`, color: COLORS.primary, borderRadius: 12, fontSize: 11, fontWeight: 1000 }}>PARENT VIEW</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: '#FFF', padding: 40, borderRadius: 36, border: '1px solid #E2E8F0' }}>
                    <h3 style={{ margin: '0 0 32px', fontSize: 20, fontWeight: 1000, color: '#0F172A' }}>Subject Performance</h3>
                    <div style={{ height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subject_mastery} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 12, fontWeight: 900, fill: '#64748B' }} />
                                <Bar dataKey="mastery" fill={COLORS.primary} radius={[0, 10, 10, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 32 }}>
                <div style={{ background: '#FFF', padding: 40, borderRadius: 36, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A' }}>Areas for Improvement</h3>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', marginTop: 4, textTransform: 'uppercase' }}>Focus Areas by Subject & Topic</div>
                        </div>
                    </div>
                    
                    {data.weak_areas?.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                            {data.weak_areas.map((wa: any, i: number) => (
                                <div key={i} style={{ padding: 24, background: '#FEF2F2', border: `1px solid ${COLORS.danger}20`, borderRadius: 24, display: 'flex', alignItems: 'flex-start', gap: 16, transition: 'all 0.2s', cursor: 'default' }} className="hover-card">
                                    <div style={{ width: 48, height: 48, borderRadius: 16, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${COLORS.danger}20`, flexShrink: 0 }}>
                                        <AlertCircle size={20} color={COLORS.danger} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 1000, color: '#0F172A', marginBottom: 4 }}>{wa.topic}</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.slate }}>{wa.subject} • {wa.chapter}</div>
                                        <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#FFF', borderRadius: 8, fontSize: 12, fontWeight: 900, color: COLORS.danger, border: `1px solid ${COLORS.danger}20` }}>
                                            Average Score: {wa.score}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: 40, textAlign: 'center', background: '#F8FAFC', borderRadius: 24, border: '2px dashed #E2E8F0' }}>
                            <div style={{ width: 56, height: 56, background: '#FFF', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #E2E8F0' }}>
                                <Shield size={24} color={COLORS.success} />
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 1000, color: '#0F172A' }}>No Critical Weaknesses</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginTop: 4 }}>Student is performing well across all mapped topics!</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function StudentDashboardView({ data }: { data: any }) {
    const { kpi, upcoming_exams, performance_trend } = data
    return (
        <div style={{ animation: 'float 0.4s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
                <KPICard label="Overall Marks" val={kpi.avg_score + '%'} icon={Award} color={COLORS.primary} bg={`${COLORS.primary}10`} trend="+3.1%" />
                <KPICard label="Tests Given" val={kpi.completed_exams} icon={UserCheck} color={COLORS.success} bg={`${COLORS.success}10`} />
                <KPICard label="Next Exams" val={kpi.pending_exams} icon={Zap} color={COLORS.warning} bg={`${COLORS.warning}10`} />
                <KPICard label="Learning Status" val="GOOD" icon={BookOpen} color="#8B5CF6" bg="#8B5CF610" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
                <div style={{ background: '#FFF', padding: 40, borderRadius: 36, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A' }}>Upcoming Tests</h3>
                        <Link href="/dashboard/student/exams" style={{ fontSize: 13, fontWeight: 1000, color: COLORS.primary, textDecoration: 'none' }}>View All →</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {upcoming_exams.map((ex: any) => (
                            <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 24, background: '#F8FAFC', borderRadius: 24, border: '1px solid #F1F5F9' }}>
                                <div style={{ width: 56, height: 56, background: '#FFF', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                                    <Target size={24} color={COLORS.primary} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 16, fontWeight: 1000, color: '#1E293B' }}>{ex.name}</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginTop: 4 }}>{ex.subject} • Important Test</div>
                                </div>
                                <button style={{ padding: '12px 24px', background: COLORS.primaryGradient, color: '#FFF', border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 1000, cursor: 'pointer', boxShadow: '0 8px 16px rgba(0,75,147,0.2)' }}>Give Test</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: '#FFF', padding: 40, borderRadius: 36, border: '1px solid #E2E8F0' }}>
                    <h3 style={{ margin: '0 0 32px', fontSize: 20, fontWeight: 1000, color: '#0F172A' }}>Progress Chart</h3>
                    <div style={{ height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performance_trend}>
                                <defs>
                                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={1}/>
                                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#94A3B8' }} dy={10} />
                                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }} />
                                <Line type="monotone" dataKey="score" stroke={COLORS.success} strokeWidth={4} dot={{ r: 6, fill: COLORS.success, strokeWidth: 3, stroke: '#FFF' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 32 }}>
                <div style={{ background: '#FFF', padding: 40, borderRadius: 36, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A' }}>Areas for Improvement</h3>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', marginTop: 4, textTransform: 'uppercase' }}>Focus Areas by Subject & Topic</div>
                        </div>
                    </div>
                    
                    {data.weak_areas?.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                            {data.weak_areas.map((wa: any, i: number) => (
                                <div key={i} style={{ padding: 24, background: '#FEF2F2', border: `1px solid ${COLORS.danger}20`, borderRadius: 24, display: 'flex', alignItems: 'flex-start', gap: 16, transition: 'all 0.2s', cursor: 'default' }} className="hover-card">
                                    <div style={{ width: 48, height: 48, borderRadius: 16, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${COLORS.danger}20`, flexShrink: 0 }}>
                                        <AlertCircle size={20} color={COLORS.danger} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 1000, color: '#0F172A', marginBottom: 4 }}>{wa.topic}</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.slate }}>{wa.subject} • {wa.chapter}</div>
                                        <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#FFF', borderRadius: 8, fontSize: 12, fontWeight: 900, color: COLORS.danger, border: `1px solid ${COLORS.danger}20` }}>
                                            Average Score: {wa.score}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: 40, textAlign: 'center', background: '#F8FAFC', borderRadius: 24, border: '2px dashed #E2E8F0' }}>
                            <div style={{ width: 56, height: 56, background: '#FFF', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #E2E8F0' }}>
                                <Shield size={24} color={COLORS.success} />
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 1000, color: '#0F172A' }}>No Critical Weaknesses</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginTop: 4 }}>You are performing well across all mapped topics!</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function AdminDashboardView({ data, role }: { data: any; role: string }) {
    return (
        <div style={{ animation: 'float 0.4s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
                <KPICard label="Total Students" val={data.kpi?.total_students} icon={Users} color={COLORS.primary} bg={`${COLORS.primary}10`} trend="+12" />
                <KPICard label="Active Today" val={data.kpi?.active_students} icon={Activity} color={COLORS.success} bg={`${COLORS.success}10`} />
                <KPICard label="Tests Created" val={data.kpi?.exams_created} icon={GraduationCap} color={COLORS.warning} bg={`${COLORS.warning}10`} />
                <KPICard label="Fees Collected" val={`₹${(data.kpi?.revenue_earned || 0).toLocaleString('en-IN')}`} icon={DollarSign} color="#8B5CF6" bg="#8B5CF610" trend="+₹2.4L" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, marginBottom: 40 }}>
                <div style={{ background: '#FFF', padding: 40, borderRadius: 36, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                         <div>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A' }}>New Admissions</h3>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', marginTop: 4, textTransform: 'uppercase' }}>STUDENT TRENDS</div>
                        </div>
                        <div style={{ padding: '10px 16px', background: '#F8FAFC', borderRadius: 12, fontSize: 12, fontWeight: 1000, color: COLORS.slate, border: '1px solid #F1F5F9' }}>2024 SESSION</div>
                    </div>
                    <div style={{ height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.charts?.student_growth}>
                                <defs>
                                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 900 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 900 }} />
                                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }} />
                                <Area type="monotone" dataKey="students" stroke={COLORS.primary} strokeWidth={4} fill="url(#growthGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ background: '#FFF', padding: 40, borderRadius: 36, border: '1px solid #E2E8F0' }}>
                     <h3 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 1000, color: '#0F172A' }}>Earnings Overview</h3>
                     <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', marginBottom: 40, textTransform: 'uppercase' }}>FEES COLLECTION TREND</div>
                     <div style={{ height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.charts?.revenue_trends}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={COLORS.success} stopOpacity={1}/>
                                        <stop offset="100%" stopColor={COLORS.success} stopOpacity={0.4}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 900 }} />
                                <Bar dataKey="revenue" fill="url(#revGrad)" radius={[8, 8, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                {[
                    { title: 'Create Exam', desc: 'Create a new test or exam.', icon: PlusCircle, href: '/dashboard/exams/new', bg: COLORS.primaryGradient, color: '#FFF' },
                    { title: 'Add Student', desc: 'Register a new student.', icon: UserPlus, href: '/dashboard/students', bg: '#111827', color: '#FFF' },
                    { title: 'Manage Syllabus', desc: 'Update course content.', icon: BookOpen, href: '/dashboard/syllabus', bg: '#FFF', color: '#111827', border: '1px solid #E2E8F0' }
                ].map((act, i) => (
                    <Link key={i} href={act.href} style={{ textDecoration: 'none' }} className="hover-card">
                        <div style={{ padding: 28, borderRadius: 28, background: act.bg, color: act.color, border: (act as any).border, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <act.icon size={26} color={act.color} />
                            </div>
                            <div>
                                <div style={{ fontSize: 17, fontWeight: 1000 }}>{act.title}</div>
                                <div style={{ fontSize: 13, opacity: 0.8, fontWeight: 700 }}>{act.desc}</div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

// ── MAIN EXPORT ─────────────────────────────────────────────────────────────

export default function PortalDashboard() {
    const [data, setData] = useState<any>(null)
    const [role, setRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>(null)

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const meRes = await fetch('/api/auth/me')
                const meData = await meRes.json()
                setRole(meData.role)

                let dashboardUrl = '/api/admin/dashboard'
                if (meData.role === 'student' || meData.role === 'parent') dashboardUrl = '/api/student/dashboard'
                
                const dbRes = await fetch(dashboardUrl)
                if (!dbRes.ok) {
                    const err = await dbRes.json()
                    throw { requiresBilling: err.requires_billing, message: err.error || 'Identity Sync Failed' }
                }
                const dbData = await dbRes.json()
                setData(dbData)
            } catch (err: any) { setError(err) }
            finally { setLoading(false) }
        }
        fetchDashboard()
    }, [])

    if (loading) return (
        <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8FAFC' }}>
             <Loader2 size={48} color={COLORS.primary} className="spin" />
             <p style={{ marginTop: 24, color: '#111827', fontWeight: 1000, fontSize: 14, letterSpacing: '0.1em' }}>LOADING DASHBOARD...</p>
             <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )

    if (error?.requiresBilling) {
        return (
            <div style={{ display: 'flex', height: '100vh', padding: 40, alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
                <div style={{ maxWidth: 460, width: '100%', background: '#fff', borderRadius: 36, padding: 48, boxShadow: '0 40px 80px rgba(0,0,0,0.06)', border: `1px solid ${COLORS.danger}20`, textAlign: 'center' }}>
                    <div style={{ width: 80, height: 80, background: '#FEF2F2', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                        <AlertCircle size={40} color={COLORS.danger} />
                    </div>
                    <h2 style={{ fontSize: 28, fontWeight: 1000, color: '#0F172A', margin: '0 0 12px', letterSpacing: '-0.03em' }}>Account Suspended</h2>
                    <p style={{ color: COLORS.slate, marginBottom: 40, fontWeight: 600, lineHeight: 1.6 }}>{error.message}</p>
                    <Link href="/dashboard/subscription" style={{ display: 'block', width: '100%', background: COLORS.danger, color: '#fff', padding: '18px', borderRadius: 20, fontWeight: 1000, textDecoration: 'none', boxShadow: `0 10px 20px ${COLORS.danger}30` }}>
                        Renew Subscription
                    </Link>
                </div>
            </div>
        )
    }

    const headerTitle = role === 'parent' ? 'Parent Dashboard' : role === 'student' ? 'Student Dashboard' : 'Admin Dashboard'
    const headerDesc = role === 'parent' ? "Monitor your child's academic progress and attendance." : role === 'student' ? 'Welcome to your student portal.' : 'Manage your school administration and overview.'

    return (
        <div style={{ padding: '48px 56px', background: COLORS.background, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <style>{`
                @keyframes float { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .hover-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
                .hover-card:hover { transform: translateY(-5px); box-shadow: 0 30px 60px rgba(0,75,147,0.08) !important; border-color: ${COLORS.primary}20 !important; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
            
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 56, animation: 'float 0.4s ease-out' }}>
                <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: `${COLORS.primary}10`, color: COLORS.primary, borderRadius: 100, fontSize: 11, fontWeight: 1000, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        <Sparkles size={14} fill={COLORS.primary} stroke="none" /> Academic Portal Active
                    </div>
                    <h1 style={{ margin: 0, fontSize: 42, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.04em' }}>{headerTitle}</h1>
                    <p style={{ margin: '8px 0 0', fontSize: 17, color: COLORS.slate, fontWeight: 600 }}>{headerDesc}</p>
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                    <button style={{ padding: '14px 28px', borderRadius: 18, background: '#FFF', border: '2px solid #F1F5F9', color: COLORS.slate, fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textTransform: 'capitalize' }}>
                        <Globe size={18} /> {role === 'tenant_admin' ? 'Admin' : role} Profile
                    </button>
                </div>
            </header>

            {role === 'parent' ? <ParentDashboardView data={data} /> : role === 'student' ? <StudentDashboardView data={data} /> : <AdminDashboardView data={data} role={role || ''} />}
        </div>
    )
}
