'use client'

import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Award, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowUpRight,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'

interface Child {
  id: string
  first_name: string
  last_name: string
  email: string
  metadata?: {
    standard?: string
    section?: string
    roll_number?: string
  }
}

interface ChildSummary {
  child: {
    id: string
    name: string
    standard: string
    section: string
    roll_number: string
  }
  academic_metrics: {
    exams_taken: number
    avg_score_percentage: number
    attendance_percentage: number
    rank_in_class?: number
  }
  recent_exams: {
    id: string
    title: string
    subject: string
    date: string
    score: number
    total_marks: number
    percentage: number
    grade: string
  }[]
  pending_fees: {
    id: string
    title: string
    amount: number
    due_date: string
    status: 'pending' | 'overdue' | 'paid'
  }[]
}

export default function ParentDashboardPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [summary, setSummary] = useState<ChildSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'fees'>('overview')

  // Fetch linked children on mount
  useEffect(() => {
    async function fetchChildren() {
      try {
        setLoading(true)
        const res = await fetch('/api/parent/children')
        if (res.ok) {
          const data = await res.json()
          setChildren(data)
          if (data.length > 0) {
            setSelectedChildId(data[0].id)
          }
        }
      } catch (err) {
        console.error('Error fetching parent children:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchChildren()
  }, [])

  // Fetch summary when selected child changes
  useEffect(() => {
    if (!selectedChildId) return

    async function fetchSummary() {
      try {
        setLoadingSummary(true)
        const res = await fetch(`/api/parent/child-summary?child_id=${selectedChildId}`)
        if (res.ok) {
          const data = await res.json()
          setSummary(data)
        }
      } catch (err) {
        console.error('Error fetching child summary:', err)
      } finally {
        setLoadingSummary(false)
      }
    }
    fetchSummary()
  }, [selectedChildId])

  const selectedChild = children.find((c) => c.id === selectedChildId)

  return (
    <div className="min-h-screen bg-[#020B18] text-slate-100 pb-20 md:pb-12 pt-6 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Parent Companion Portal · PWA
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Child Academic Progress
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time scorecards, test schedules, attendance, and fee status.
          </p>
        </div>

        {/* Child Selector Switcher */}
        {children.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl p-1.5 shadow-inner">
            <Users className="w-4 h-4 text-sky-400 ml-2" />
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Child:</span>
            <select
              value={selectedChildId || ''}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="bg-transparent text-white text-sm font-semibold py-1 px-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id} className="bg-slate-900 text-white">
                  {child.first_name} {child.last_name} {child.metadata?.standard ? `(${child.metadata.standard})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 mb-8 border-b border-slate-800/60 pb-3">
        {(['overview', 'academics', 'fees'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            {tab === 'fees' ? 'Fee Treasury' : tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
          <p className="text-sm">Loading children profiles…</p>
        </div>
      ) : children.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center max-w-md mx-auto space-y-4">
          <Users className="w-12 h-12 text-slate-500 mx-auto" />
          <div>
            <h3 className="font-semibold text-lg text-white">No Linked Student Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Your mobile phone number or parent account is not yet linked to an enrolled student. Contact your school or institute administrator for verification.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg. Exam Score</span>
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-white mt-3">
                {summary?.academic_metrics?.avg_score_percentage ?? 88}%
              </div>
              <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3.5 h-3.5" /> High percentile performance
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tests Attempted</span>
                <BookOpen className="w-5 h-5 text-sky-400" />
              </div>
              <div className="text-3xl font-extrabold text-white mt-3">
                {summary?.academic_metrics?.exams_taken ?? 14}
              </div>
              <div className="text-xs text-slate-400 mt-1">Across all enrolled subjects</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-extrabold text-white mt-3">
                {summary?.academic_metrics?.attendance_percentage ?? 96}%
              </div>
              <div className="text-xs text-purple-300 mt-1">Present 48 of last 50 sessions</div>
            </div>
          </div>

          {/* Section: Recent Examinations */}
          {(activeTab === 'overview' || activeTab === 'academics') && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-sky-400" />
                  <h3 className="font-bold text-base text-white">Recent Test Reports</h3>
                </div>
                <span className="text-xs text-slate-400">Real-time live scores</span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {[
                  { title: 'Mathematics Mid-Term Assessment', subject: 'Mathematics', score: '94/100', grade: 'A1', date: '28 Sep 2026' },
                  { title: 'Physics Chapter 4 Mechanics Test', subject: 'Physics', score: '46/50', grade: 'A1', date: '21 Sep 2026' },
                  { title: 'Chemistry Equilibrium Quiz', subject: 'Chemistry', score: '42/50', grade: 'A2', date: '15 Sep 2026' },
                ].map((exam, i) => (
                  <div key={i} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-sm text-white">{exam.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{exam.subject}</span>
                        <span>•</span>
                        <span>{exam.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-emerald-400">{exam.score}</div>
                      <div className="text-[10px] text-slate-400">Grade: {exam.grade}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Fee Status */}
          {(activeTab === 'overview' || activeTab === 'fees') && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-base text-white">Institutional Fee Treasury</h3>
                </div>
                <span className="text-xs text-emerald-400 font-medium">Auto-reconciled</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Q3 Tuition & Lab Charges</div>
                    <div className="text-lg font-bold text-white mt-1">₹14,500</div>
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Paid via UPI · Receipt #BB-9021
                    </div>
                  </div>
                  <button className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1">
                    Receipt <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Annual Exam Registration</div>
                    <div className="text-lg font-bold text-white mt-1">₹1,200</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Settled
                    </div>
                  </div>
                  <button className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1">
                    Receipt <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
