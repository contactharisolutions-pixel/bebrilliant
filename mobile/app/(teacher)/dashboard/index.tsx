import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { VictoryLine, VictoryBar, VictoryChart, VictoryAxis, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native'
import { useIdentity } from '../../../contexts/IdentityContext'
import { Award, Users, Video, BookOpen, Sparkles, TrendingUp, Calendar } from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'

interface DashboardStats {
  students: number
  exams: number
  liveClasses: number
  pendingSubmissions: number
}

interface AnalyticsData {
  examPerformance: Array<{ name: string; avg_score: number; pass_rate: number }>
  attendanceTrend: Array<{ date: string; present: number; absent: number; late: number }>
}

export default function TeacherDashboard() {
  const router = useRouter()
  const { user } = useIdentity()
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [statsData, analyticsData] = await Promise.all([
        apiFetch('/api/teacher/dashboard-summary'),
        apiFetch('/api/teacher/analytics')
      ])
      setStats(statsData)
      setAnalytics(analyticsData)
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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
          Welcome Back
        </Text>
        <Text className="mt-1 text-2xl font-black text-white">
          {user?.fullName || 'Educator'}
        </Text>
        <Text className="mt-2 text-sm text-white/80">
          Institution: {user?.tenant?.name || 'BrightBoard Institution'}
        </Text>
      </View>

      {/* KPI Stats Grid */}
      <View className="mt-8 flex-row flex-wrap justify-between">
        {/* Students */}
        <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm mb-4">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10 mb-3">
            <Users size={18} color="#004B93" />
          </View>
          <Text className="text-2xl font-black text-text-primary">{stats?.students || 0}</Text>
          <Text className="text-[11px] font-bold text-text-secondary mt-1">Total Students</Text>
        </View>

        {/* Exams */}
        <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm mb-4">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-violet-100 mb-3">
            <BookOpen size={18} color="#7C3AED" />
          </View>
          <Text className="text-2xl font-black text-text-primary">{stats?.exams || 0}</Text>
          <Text className="text-[11px] font-bold text-text-secondary mt-1">Total Exams</Text>
        </View>

        {/* Live Classes */}
        <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm mb-4">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 mb-3">
            <Video size={18} color="#10B981" />
          </View>
          <Text className="text-2xl font-black text-text-primary">{stats?.liveClasses || 0}</Text>
          <Text className="text-[11px] font-bold text-text-secondary mt-1">Live Classes Today</Text>
        </View>

        {/* Pending Grading */}
        <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm mb-4">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-100 mb-3">
            <Award size={18} color="#F59E0B" />
          </View>
          <Text className="text-2xl font-black text-text-primary">{stats?.pendingSubmissions || 0}</Text>
          <Text className="text-[11px] font-bold text-text-secondary mt-1">Pending Submissions</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="mt-4">
        <Text className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-4">
          Quick Actions
        </Text>
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.push('/(teacher)/exams/ai-generator')}
            className="w-[48%] flex-row items-center justify-center rounded-2xl bg-violet-600 py-4 shadow-sm active:opacity-90"
          >
            <Sparkles size={16} color="#FFF" />
            <Text className="text-white font-bold text-sm ml-2">Generate Exam</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(teacher)/live')}
            className="w-[48%] flex-row items-center justify-center rounded-2xl bg-primary py-4 shadow-sm active:opacity-90"
          >
            <Video size={16} color="#FFF" />
            <Text className="text-white font-bold text-sm ml-2">Launch Live</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Analytics Section */}
      {analytics && (
        <View className="mt-4 pb-12 space-y-6">
          {/* Exam Scores Performance Line Chart */}
          {analytics.examPerformance.length > 0 && (
            <View className="rounded-3xl bg-white border border-border p-5 shadow-sm mb-6">
              <View className="flex-row items-center mb-3">
                <TrendingUp size={16} color="#004B93" />
                <Text className="text-sm font-black text-text-primary ml-2">Average Exam Scores</Text>
              </View>
              <View className="align-center justify-center">
                <VictoryChart
                  height={200}
                  padding={{ top: 20, bottom: 40, left: 40, right: 20 }}
                  containerComponent={<VictoryVoronoiContainer />}
                >
                  <VictoryAxis
                    tickFormat={(x: any) => {
                      const examName = analytics.examPerformance[x - 1]?.name || ''
                      return examName.length > 8 ? `${examName.substring(0, 8)}...` : examName
                    }}
                    style={{
                      tickLabels: { fontSize: 8, fill: '#6B7280' }
                    }}
                  />
                  <VictoryAxis
                    dependentAxis
                    style={{
                      tickLabels: { fontSize: 8, fill: '#6B7280' }
                    }}
                  />
                  <VictoryLine
                    data={analytics.examPerformance.map((ep, idx) => ({
                      x: idx + 1,
                      y: ep.avg_score,
                      label: `${ep.avg_score.toFixed(0)}%`
                    }))}
                    style={{
                      data: { stroke: '#004B93', strokeWidth: 3 }
                    }}
                  />
                </VictoryChart>
              </View>
            </View>
          )}

          {/* Daily Attendance Bar Chart */}
          {analytics.attendanceTrend.length > 0 && (
            <View className="rounded-3xl bg-white border border-border p-5 shadow-sm mb-6">
              <View className="flex-row items-center mb-3">
                <Calendar size={16} color="#10B981" />
                <Text className="text-sm font-black text-text-primary ml-2">Daily Attendance Trends</Text>
              </View>
              <View className="align-center justify-center">
                <VictoryChart
                  height={200}
                  padding={{ top: 20, bottom: 40, left: 40, right: 20 }}
                >
                  <VictoryAxis
                    tickFormat={(x: any) => {
                      const dateStr = analytics.attendanceTrend[x - 1]?.date || ''
                      return dateStr.substring(5) // MM-DD
                    }}
                    style={{
                      tickLabels: { fontSize: 8, fill: '#6B7280' }
                    }}
                  />
                  <VictoryAxis
                    dependentAxis
                    style={{
                      tickLabels: { fontSize: 8, fill: '#6B7280' }
                    }}
                  />
                  <VictoryBar
                    data={analytics.attendanceTrend.map((at, idx) => ({
                      x: idx + 1,
                      y: at.present
                    }))}
                    style={{
                      data: { fill: '#10B981', width: 12 }
                    }}
                  />
                </VictoryChart>
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  )
}
