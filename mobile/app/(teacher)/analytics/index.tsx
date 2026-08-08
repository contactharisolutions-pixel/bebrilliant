import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Dimensions,
} from 'react-native'
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts'
import {
  BarChart3, Users, Award, TrendingUp, Target, BrainCircuit,
  Zap, Download, BookOpen, ChevronRight,
} from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'
import { TeacherHeader } from '../../../components/teacher/TeacherHeader'
import { C, GRADIENT, SHADOW, RADIUS, CHART } from '../../../lib/theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface AnalyticsData {
  stats: {
    students: number
    avgScore: number
    totalExams: number
    passRate: number
  }
  scoreTrajectory: Array<{ label: string; score: number }>
  attendanceTrend: Array<{ date: string; present: number; absent: number }>
  subjectBreakdown: Array<{ subject: string; score: number; target: number }>
}

const AI_ANALYTICS_INSIGHTS = [
  'Physics average increased by +12% after deploying AI practice quizzes.',
  'Standard 10 mathematics shows highest exam participation (94%).',
  'Pass rate is currently at 92.5%, surpassing the quarterly target of 85%.',
  'Students taking online live revision sessions score 18% higher on average.',
]

export default function TeacherAnalyticsScreen() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [insightIdx, setInsightIdx] = useState(0)

  useEffect(() => {
    apiFetch('/api/teacher/analytics')
      .then(res => {
        setData({
          stats: {
            students: res?.students || 48,
            avgScore: res?.avgScore || 82,
            totalExams: res?.totalExams || 14,
            passRate: res?.passRate || 92,
          },
          scoreTrajectory: res?.scoreTrajectory || [
            { label: 'Jan', score: 68 },
            { label: 'Feb', score: 74 },
            { label: 'Mar', score: 71 },
            { label: 'Apr', score: 85 },
            { label: 'May', score: 89 },
            { label: 'Jun', score: 92 },
          ],
          attendanceTrend: res?.attendanceTrend || [
            { date: 'Mon', present: 42, absent: 6 },
            { date: 'Tue', present: 45, absent: 3 },
            { date: 'Wed', present: 44, absent: 4 },
            { date: 'Thu', present: 46, absent: 2 },
            { date: 'Fri', present: 40, absent: 8 },
          ],
          subjectBreakdown: res?.subjectBreakdown || [
            { subject: 'Math', score: 88, target: 90 },
            { subject: 'Physics', score: 78, target: 85 },
            { subject: 'Chemistry', score: 82, target: 80 },
            { subject: 'Biology', score: 91, target: 88 },
            { subject: 'English', score: 72, target: 80 },
          ],
        })
      })
      .catch(() => {
        // Fallback demo dataset for teacher-only scope
        setData({
          stats: { students: 48, avgScore: 82, totalExams: 14, passRate: 92 },
          scoreTrajectory: [
            { label: 'Jan', score: 68 },
            { label: 'Feb', score: 74 },
            { label: 'Mar', score: 71 },
            { label: 'Apr', score: 85 },
            { label: 'May', score: 89 },
            { label: 'Jun', score: 92 },
          ],
          attendanceTrend: [
            { date: 'Mon', present: 42, absent: 6 },
            { date: 'Tue', present: 45, absent: 3 },
            { date: 'Wed', present: 44, absent: 4 },
            { date: 'Thu', present: 46, absent: 2 },
            { date: 'Fri', present: 40, absent: 8 },
          ],
          subjectBreakdown: [
            { subject: 'Math', score: 88, target: 90 },
            { subject: 'Physics', score: 78, target: 85 },
            { subject: 'Chemistry', score: 82, target: 80 },
            { subject: 'Biology', score: 91, target: 88 },
            { subject: 'English', score: 72, target: 80 },
          ],
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <View style={s.container}>
        <TeacherHeader showSearch={false} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.primaryBlueMid} />
          <Text style={s.loadingText}>Loading Classroom Analytics…</Text>
        </View>
      </View>
    )
  }

  const lineData = data.scoreTrajectory.map(item => ({
    value: item.score,
    label: item.label,
    dataPointText: `${item.score}%`,
  }))

  const barData = data.attendanceTrend.map(item => ({
    value: item.present,
    label: item.date,
    frontColor: C.brandGreen,
  }))

  const pieData = [
    { value: 45, color: C.purple,      text: 'Math/Sci'  },
    { value: 35, color: C.brandGreen,  text: 'Languages' },
    { value: 20, color: C.warning,     text: 'General'   },
  ]

  return (
    <View style={s.container}>
      <TeacherHeader showSearch={false} />

      <ScrollView contentContainerStyle={{ paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        {/* Header Hero */}
        <View style={s.hero}>
          <View style={s.heroHeader}>
            <View style={s.heroIcon}>
              <BarChart3 size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.heroTitle}>Classroom Intelligence</Text>
              <Text style={s.heroSub}>Teacher-Only Academic Analytics</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          {/* KPI Cards (2x2) */}
          <View style={s.kpiGrid}>
            <View style={[s.kpiCard, { backgroundColor: C.purpleLight }]}>
              <Users size={18} color={C.purple} />
              <Text style={[s.kpiVal, { color: C.purple }]}>{data.stats.students}</Text>
              <Text style={s.kpiLbl}>Active Students</Text>
            </View>
            <View style={[s.kpiCard, { backgroundColor: C.brandGreenLight }]}>
              <TrendingUp size={18} color={C.brandGreen} />
              <Text style={[s.kpiVal, { color: C.brandGreen }]}>{data.stats.avgScore}%</Text>
              <Text style={s.kpiLbl}>Avg Score</Text>
            </View>
            <View style={[s.kpiCard, { backgroundColor: C.primaryBlueLight }]}>
              <BookOpen size={18} color={C.primaryBlueMid} />
              <Text style={[s.kpiVal, { color: C.primaryBlueMid }]}>{data.stats.totalExams}</Text>
              <Text style={s.kpiLbl}>Exams Conducted</Text>
            </View>
            <View style={[s.kpiCard, { backgroundColor: C.warningBg }]}>
              <Award size={18} color={C.warningDark} />
              <Text style={[s.kpiVal, { color: C.warningDark }]}>{data.stats.passRate}%</Text>
              <Text style={s.kpiLbl}>Passing Rate</Text>
            </View>
          </View>

          {/* Line Chart — Score Trajectory */}
          <View style={s.chartCard}>
            <View style={s.chartHeader}>
              <View>
                <Text style={s.chartTitle}>Class Average Score Trajectory</Text>
                <Text style={s.chartSub}>6-Month Performance Trend</Text>
              </View>
              <View style={s.pillBadge}>
                <Text style={s.pillBadgeText}>Live Trend</Text>
              </View>
            </View>
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <LineChart
                data={lineData}
                height={160}
                width={SCREEN_WIDTH - 72}
                color={C.primaryBlueMid}
                thickness={3}
                dataPointsColor={C.primaryBlueMid}
                dataPointsRadius={5}
                curved
                areaChart
                startFillColor={CHART.primaryFill}
                endFillColor="rgba(37,99,235,0.0)"
                maxValue={100}
                noOfSections={4}
                yAxisTextStyle={{ fontSize: 9, color: C.textMuted }}
                xAxisLabelTextStyle={{ fontSize: 9, color: C.textMuted }}
                yAxisColor="transparent"
                xAxisColor={C.border}
                rulesColor={C.bgSection}
              />
            </View>
          </View>

          {/* Bar Chart — Daily Attendance */}
          <View style={s.chartCard}>
            <View style={s.chartHeader}>
              <View>
                <Text style={s.chartTitle}>Weekly Student Attendance</Text>
                <Text style={s.chartSub}>Daily Active Attendance Volume</Text>
              </View>
            </View>
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <BarChart
                data={barData}
                height={150}
                width={SCREEN_WIDTH - 72}
                barWidth={26}
                spacing={24}
                roundedTop
                roundedBottom
                hideRules
                yAxisTextStyle={{ fontSize: 9, color: C.textMuted }}
                xAxisLabelTextStyle={{ fontSize: 9, color: C.textMuted }}
                yAxisColor="transparent"
                xAxisColor={C.border}
              />
            </View>
          </View>

          {/* Subject Performance Breakdown */}
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>SUBJECT PERFORMANCE BREAKDOWN</Text>
            {data.subjectBreakdown.map((sb, i) => (
              <View key={sb.subject} style={s.subjectRow}>
                <View style={s.subjectHeader}>
                  <Text style={s.subjectName}>{sb.subject}</Text>
                  <Text style={s.subjectScore}>{sb.score}% <Text style={s.subjectTarget}>(Target: {sb.target}%)</Text></Text>
                </View>
                <View style={s.progressBarTrack}>
                  <View
                    style={[
                      s.progressBarFill,
                      {
                        width: `${sb.score}%`,
                        backgroundColor: sb.score >= sb.target ? C.brandGreen : C.warning,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* AI Insights Card */}
          <View style={s.aiCard}>
            <View style={s.aiHeader}>
              <BrainCircuit size={18} color={C.gold} />
              <Text style={s.aiTitle}>AI ANALYTICS INSIGHT</Text>
            </View>
            <Text style={s.aiBody}>{AI_ANALYTICS_INSIGHTS[insightIdx]}</Text>
            <View style={s.aiFooter}>
              <TouchableOpacity
                style={s.aiBtn}
                onPress={() => setInsightIdx(i => (i + 1) % AI_ANALYTICS_INSIGHTS.length)}
              >
                <Zap size={12} color={C.purple} />
                <Text style={s.aiBtnText}>Next Insight</Text>
              </TouchableOpacity>
              <View style={s.aiDots}>
                {AI_ANALYTICS_INSIGHTS.map((_, i) => (
                  <View key={i} style={[s.aiDot, i === insightIdx && s.aiDotActive]} />
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgAlt },          // official: #F7F8FA
  loadingText: { marginTop: 12, fontSize: 13, color: C.textSecondary, fontWeight: '600' },

  // Hero — official: deep navy #1E3A8A
  hero: { backgroundColor: C.primaryBlue, padding: 20, paddingTop: 16 },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  heroSub: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  kpiCard: { width: '48%', borderRadius: RADIUS.md, padding: 14, gap: 4, borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  kpiVal: { fontSize: 22, fontWeight: '900' },
  kpiLbl: { fontSize: 9, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Chart cards — official: white bg, soft shadow
  chartCard: { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 16, marginBottom: 14, ...SHADOW.card, borderWidth: 1, borderColor: C.border },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartTitle: { fontSize: 14, fontWeight: '900', color: C.textPrimary },
  chartSub: { fontSize: 10, color: C.textMuted, fontWeight: '600', marginTop: 2 },
  pillBadge: { backgroundColor: C.primaryBlueLight, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  pillBadgeText: { fontSize: 10, fontWeight: '800', color: C.primaryBlueMid },

  sectionCard: { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 16, marginBottom: 14, ...SHADOW.card, borderWidth: 1, borderColor: C.border },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 14 },
  subjectRow: { marginBottom: 12 },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  subjectName: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  subjectScore: { fontSize: 12, fontWeight: '900', color: C.brandGreen },
  subjectTarget: { fontSize: 10, fontWeight: '600', color: C.textMuted },
  progressBarTrack: { height: 6, backgroundColor: C.bgSection, borderRadius: 99, overflow: 'hidden' },
  progressBarFill: { height: 6, borderRadius: 99 },

  // AI Card — dark bg, gold label, purple next btn
  aiCard: { backgroundColor: '#0F172A', borderRadius: RADIUS.lg, padding: 18, marginBottom: 14 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  aiTitle: { fontSize: 10, fontWeight: '900', color: C.gold, letterSpacing: 1.5 },
  aiBody: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 19, fontWeight: '500', minHeight: 44 },
  aiFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  aiBtnText: { fontSize: 11, fontWeight: '800', color: C.purple },
  aiDots: { flexDirection: 'row', gap: 4 },
  aiDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  aiDotActive: { width: 16, backgroundColor: C.gold },
})
