import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useIdentity } from '../../../contexts/IdentityContext'
import { Award, BookOpen, Wallet, ChevronRight, Video, FileText } from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'
import { useExams } from '../../../hooks/useExams'

interface DashboardStats {
  credits: number
  avgScore: number
  completedExams: number
  liveToday: number
}

export default function StudentDashboard() {
  const router = useRouter()
  const { user } = useIdentity()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { data: examData } = useExams()

  const fetchStats = async () => {
    try {
      const data = await apiFetch('/api/student/dashboard-summary')
      setStats(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const nextExam = examData?.exams?.find(ex => ex.is_active)

  if (loading) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center">
        <ActivityIndicator size="large" color="#004B93" />
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-bg-card2 px-5 py-6">
      {/* Welcome Card */}
      <View className="rounded-3xl bg-primary p-6 shadow-lg shadow-primary/20">
        <Text className="text-xs font-bold uppercase tracking-wider text-white/70">
          Student Portal
        </Text>
        <Text className="mt-1 text-2xl font-black text-white">
          {user?.fullName || 'Student'}
        </Text>
        <Text className="mt-2 text-sm text-white/80">
          Institution: {user?.tenant?.name || 'BrightBoard Institution'}
        </Text>
      </View>

      {/* Wallet Balance Display Card */}
      <TouchableOpacity
        onPress={() => router.push('/(student)/wallet')}
        className="mt-6 rounded-2xl bg-white border border-border p-5 shadow-sm flex-row justify-between items-center active:opacity-95"
      >
        <View>
          <Text className="text-xs font-bold uppercase text-text-secondary tracking-wide">
            Affiliate Credits / Wallet
          </Text>
          <Text className="text-2xl font-black text-text-primary mt-1">
            ₹{(stats?.credits || 0).toFixed(2)}
          </Text>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
          <Wallet size={20} color="#10B981" />
        </View>
      </TouchableOpacity>

      {/* KPI / Progress Summary */}
      <View className="mt-6 flex-row justify-between">
        <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-3">
            <BookOpen size={20} color="#004B93" />
          </View>
          <Text className="text-2xl font-black text-text-primary">
            {stats?.completedExams || 0}
          </Text>
          <Text className="text-xs font-bold text-text-secondary mt-1">Exams Completed</Text>
        </View>

        <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-success/10 mb-3">
            <Award size={20} color="#1FAC63" />
          </View>
          <Text className="text-2xl font-black text-text-primary">
            {stats?.avgScore || 0}%
          </Text>
          <Text className="text-xs font-bold text-text-secondary mt-1">Average Grade</Text>
        </View>
      </View>

      {/* Primary Actions Grid */}
      <View className="mt-6">
        <Text className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-3">
          Quick Access
        </Text>
        <View className="flex-row justify-between">
          <TouchableOpacity
            onPress={() => router.push('/(student)/materials')}
            className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm flex-row items-center active:opacity-90"
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10 mr-3">
              <FileText size={16} color="#004B93" />
            </View>
            <Text className="text-xs font-bold text-text-primary">Study Vault</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(student)/live')}
            className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm flex-row items-center active:opacity-90"
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 mr-3">
              <Video size={16} color="#10B981" />
            </View>
            <Text className="text-xs font-bold text-text-primary">
              Live Session {stats?.liveToday && stats.liveToday > 0 ? '🔴' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Schedule / Active Exam */}
      <View className="mt-8 mb-12">
        <Text className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-4">
          Upcoming Schedule
        </Text>
        {nextExam ? (
          <TouchableOpacity
            onPress={() => router.push('/(student)/exams')}
            className="flex-row items-center justify-between rounded-2xl bg-white border border-border p-4 shadow-sm mb-4 active:opacity-95"
          >
            <View className="flex-row items-center flex-1 pr-4">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-violet-100 mr-4">
                <Award size={22} color="#7C3AED" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-text-primary" numberOfLines={1}>
                  {nextExam.name}
                </Text>
                <Text className="text-xs text-text-muted mt-0.5">
                  Available now · {nextExam.duration || 60} mins
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ) : (
          <View className="rounded-2xl border border-border bg-white p-6 items-center justify-center">
            <BookOpen size={24} color="#9CA3AF" />
            <Text className="text-xs text-text-secondary mt-2">No exams scheduled currently</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
