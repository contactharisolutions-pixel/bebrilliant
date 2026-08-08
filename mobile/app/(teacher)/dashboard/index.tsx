import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  Users,
  BookOpen,
  Video,
  Award,
  Sparkles,
  ChevronRight,
  Zap,
  TrendingUp,
  BrainCircuit,
  UploadCloud,
  PlusCircle,
} from 'lucide-react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { LineChart } from 'react-native-gifted-charts'
import { useIdentity } from '../../../contexts/IdentityContext'
import { apiFetch } from '../../../lib/api'
import { TeacherHeader } from '../../../components/teacher/TeacherHeader'
import { C, GRADIENT, SHADOW, RADIUS, CHART, ROLE } from '../../../lib/theme'

// ─── Types ───────────────────────────────────────────────────────────────────
interface DashStats {
  students: number
  exams: number
  liveClasses: number
  pendingSubmissions: number
}
interface ExamPerf {
  name: string
  avg_score: number
}
interface ActiveExam {
  id: string
  name: string
  is_active: boolean
  duration?: number
  exam_config?: { total_questions: number }
}

// ─── Animated Card ────────────────────────────────────────────────────────────
function FadeCard({ children, delay = 0, style }: any) {
  const opacity = useSharedValue(0)
  const ty      = useSharedValue(18)
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 480, easing: Easing.out(Easing.quad) }))
    ty.value      = withDelay(delay, withTiming(0, { duration: 480, easing: Easing.out(Easing.quad) }))
  }, [])
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: ty.value }] }))
  return <Animated.View style={[anim, style]}>{children}</Animated.View>
}

// ─── AI Tips ─────────────────────────────────────────────────────────────────
const AI_TIPS = [
  'Class B average dropped 8% in Physics last 2 exams — consider a revision session on Optics.',
  "3 students haven't attempted any exam this month. Consider sending a reminder notification.",
  'Your morning sessions have 22% higher attendance than afternoon ones.',
  'Top performer: Aarav Sharma (93% avg). Consider enrolling them in advanced modules.',
]

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const router = useRouter()
  const { user } = useIdentity()

  const [stats, setStats]       = useState<DashStats | null>(null)
  const [exams, setExams]       = useState<ActiveExam[]>([])
  const [perfData, setPerfData] = useState<ExamPerf[]>([])
  const [loading, setLoading]   = useState(true)
  const [tipIdx, setTipIdx]     = useState(0)

  const firstName = user?.fullName?.split(' ')[0] || 'Teacher'
  const initial   = user?.fullName?.charAt(0).toUpperCase() || 'T'
  const hour      = new Date().getHours()
  const greet     = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    apiFetch('/api/teacher/dashboard-summary')
      .then(data => {
        setStats({
          students: data?.students || 0,
          exams: data?.exams || 0,
          liveClasses: data?.liveClasses || 0,
          pendingSubmissions: data?.pendingSubmissions || 0,
        })
        setPerfData(data?.examPerformance || [])
        setExams(data?.activeExams || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Chart data for gifted-charts
  const lineData = perfData.length > 0
    ? perfData.map((ep, i) => ({ value: Math.round(ep.avg_score), label: `E${i + 1}`, dataPointText: `${Math.round(ep.avg_score)}%` }))
    : [{ value: 72 }, { value: 68 }, { value: 80 }, { value: 75 }, { value: 88 }, { value: 91 }]

  const QUICK_ACTIONS = [
    { icon: Sparkles,    label: 'AI Exam',  color: C.purple,        bg: C.purpleLight,       route: '/(teacher)/exams/ai-generator' },
    { icon: Video,       label: 'Go Live',  color: C.error,         bg: C.errorBg,           route: '/(teacher)/live' },
    { icon: UploadCloud, label: 'Upload',   color: C.brandGreen,    bg: C.brandGreenLight,   route: '/(teacher)/materials' },
    { icon: Users,       label: 'Students', color: C.primaryBlueMid,bg: C.primaryBlueLight,  route: '/(teacher)/students' },
  ]

  if (loading) {
    return (
      <View style={styles.container}>
        <TeacherHeader showSearch={false} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.primaryBlueMid} />
          <Text style={styles.loadingText}>Loading Faculty Hub…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TeacherHeader showSearch={false} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 36 }} showsVerticalScrollIndicator={false}>

        {/* ── HERO WELCOME CARD ─────────────────────────────── */}
        <FadeCard delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.heroOrb1} />
            <View style={styles.heroOrb2} />
            <View style={styles.heroBadge}>
              <View style={styles.heroPulseDot} />
              <Text style={styles.heroBadgeText}>EDUCATOR · ACTIVE</Text>
            </View>
            <Text style={styles.heroGreet}>{greet},</Text>
            <Text style={styles.heroName}>{firstName}! 👋</Text>
            <Text style={styles.heroSub}>{user?.tenant?.name || 'BeBrilliant'} · Faculty Dashboard</Text>
            <View style={styles.heroStats}>
              {[
                { label: 'Students', value: stats?.students ?? 0 },
                { label: 'Exams',    value: stats?.exams ?? 0 },
                { label: 'Live',     value: stats?.liveClasses ?? 0 },
              ].map((s, i) => (
                <View key={i} style={[styles.heroStat, i < 2 && styles.heroStatBorder]}>
                  <Text style={styles.heroStatVal}>{s.value}</Text>
                  <Text style={styles.heroStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeCard>

        {/* ── 4 KPI TILES ───────────────────────────────────── */}
        <View style={styles.kpiGrid}>
          {[
            { icon: Users,    label: 'My Students',    value: stats?.students ?? 0,          color: C.primaryBlueMid, bg: C.primaryBlueLight },
            { icon: BookOpen, label: 'Active Exams',   value: stats?.exams ?? 0,             color: C.purple,         bg: C.purpleLight       },
            { icon: Video,    label: 'Live Sessions',  value: stats?.liveClasses ?? 0,       color: C.error,          bg: C.errorBg           },
            { icon: Award,    label: 'Pending Grading',value: stats?.pendingSubmissions ?? 0, color: C.warning,        bg: C.warningBg         },
          ].map(({ icon: Icon, label, value, color, bg }, i) => (
            <FadeCard key={label} delay={100 + i * 60} style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: bg }]}>
                <Icon size={18} color={color} />
              </View>
              <Text style={[styles.kpiValue, { color }]}>{value}</Text>
              <Text style={styles.kpiLabel}>{label}</Text>
            </FadeCard>
          ))}
        </View>

        {/* ── QUICK ACTIONS ─────────────────────────────────── */}
        <FadeCard delay={300} style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.quickRow}>
            {QUICK_ACTIONS.map(({ icon: Icon, label, color, bg, route }, i) => (
              <TouchableOpacity
                key={label}
                style={[styles.quickBtn, { backgroundColor: bg }]}
                onPress={() => router.push(route as any)}
                activeOpacity={0.8}
              >
                <Icon size={22} color={color} />
                <Text style={[styles.quickLabel, { color }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeCard>

        {/* ── ACTIVE EXAMS SCROLL ────────────────────────────── */}
        {exams.length > 0 && (
          <FadeCard delay={380} style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>ACTIVE EXAMS</Text>
              <TouchableOpacity onPress={() => router.push('/(teacher)/exams')} style={styles.seeAll}>
                <Text style={styles.seeAllText}>See All</Text>
                <ChevronRight size={13} color={C.primaryBlueMid} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
              {exams.map(ex => (
                <TouchableOpacity
                  key={ex.id}
                  style={[styles.examChip, ex.is_active && styles.examChipLive]}
                  onPress={() => router.push(`/(teacher)/exams/${ex.id}` as any)}
                  activeOpacity={0.85}
                >
                  {ex.is_active && <View style={styles.examLiveStripe} />}
                  <Text style={styles.examChipName} numberOfLines={1}>{ex.name}</Text>
                  <View style={styles.examChipMeta}>
                    <Text style={styles.examChipMetaText}>{ex.exam_config?.total_questions ?? '—'} Qs · {ex.duration ?? 60} min</Text>
                    <View style={[styles.examBadge, ex.is_active ? styles.examBadgeLive : styles.examBadgeDraft]}>
                      {ex.is_active && <View style={styles.examBadgeDot} />}
                      <Text style={[styles.examBadgeText, { color: ex.is_active ? C.error : C.textMuted }]}>
                        {ex.is_active ? 'LIVE' : 'DRAFT'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </FadeCard>
        )}

        {/* ── SCORE TRAJECTORY CHART ────────────────────────── */}
        <FadeCard delay={460} style={styles.section}>
          <View style={styles.chartCard}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.chartTitle}>Score Trajectory</Text>
                <Text style={styles.chartSub}>Average score across recent exams</Text>
              </View>
              <View style={styles.trendBadge}>
                <TrendingUp size={11} color={C.success} />
                <Text style={styles.trendText}>Trending</Text>
              </View>
            </View>
            <LineChart
              data={lineData}
              height={160}
              width={320}
              color={C.primaryBlueMid}
              thickness={3}
              dataPointsColor={C.primaryBlueMid}
              dataPointsRadius={5}
              curved
              areaChart
              startFillColor={CHART.primaryFill}
              endFillColor="rgba(37,99,235,0)"
              startOpacity={0.9}
              endOpacity={0.2}
              initialSpacing={16}
              noOfSections={4}
              maxValue={100}
              yAxisColor="transparent"
              xAxisColor={C.border}
              rulesColor={C.bgSection}
              yAxisTextStyle={{ fontSize: 9, color: C.textMuted }}
              xAxisLabelTextStyle={{ fontSize: 9, color: C.textMuted }}
              hideYAxisText={false}
              showReferenceLine1
              referenceLine1Position={75}
              referenceLine1Config={{ color: C.border, dashWidth: 4, dashGap: 4 }}
            />
          </View>
        </FadeCard>

        {/* ── AI INSIGHT CARD ──────────────────────────────────── */}
        <FadeCard delay={540} style={styles.section}>
          <View style={styles.aiCard}>
            <View style={styles.aiOrb} />
            <View style={styles.aiHeader}>
              <BrainCircuit size={18} color={C.gold} />
              <Text style={styles.aiLabel}>AI CLASSROOM ADVISOR</Text>
            </View>
            <Text style={styles.aiTip}>{AI_TIPS[tipIdx]}</Text>
            <View style={styles.aiFooter}>
              <TouchableOpacity
                style={styles.aiNextBtn}
                onPress={() => setTipIdx(i => (i + 1) % AI_TIPS.length)}
              >
                <Zap size={12} color={C.purple} />
                <Text style={styles.aiNextText}>Next Insight</Text>
              </TouchableOpacity>
              <View style={styles.aiDots}>
                {AI_TIPS.map((_, i) => (
                  <View key={i} style={[styles.aiDot, i === tipIdx && styles.aiDotActive]} />
                ))}
              </View>
            </View>
          </View>
        </FadeCard>

        {/* ── CREATE EXAM CTA ───────────────────────────────────── */}
        <FadeCard delay={600} style={[styles.section, { paddingBottom: 0 }]}>
          <TouchableOpacity
            onPress={() => router.push('/(teacher)/exams/create')}
            activeOpacity={0.88}
            style={{ borderRadius: RADIUS.lg, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={[...GRADIENT.colors]}
              start={GRADIENT.start}
              end={GRADIENT.end}
              style={styles.createExamBtn}
            >
              <PlusCircle size={20} color="#FFFFFF" />
              <Text style={styles.createExamText}>Create New Exam</Text>
              <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          </TouchableOpacity>
        </FadeCard>

      </ScrollView>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgAlt },
  loadingText: { marginTop: 12, fontSize: 13, color: C.textSecondary, fontWeight: '600' },

  // Hero
  heroCard: {
    backgroundColor: C.primaryBlue,
    paddingHorizontal: 20,
    paddingVertical: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroOrb1: { position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: C.brandGreen, opacity: 0.18 },
  heroOrb2: { position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: C.primaryBlueMid, opacity: 0.25 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 12 },
  heroPulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.brandGreen },
  heroBadgeText: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
  heroGreet: { fontSize: 14, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  heroName: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginTop: 2 },
  heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginTop: 4 },
  heroStats: { flexDirection: 'row', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.12)' },
  heroStatVal: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  heroStatLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },

  // KPI
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 16, gap: 10 },
  kpiCard: { width: '47%', backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 14, ...SHADOW.card, marginHorizontal: 2, borderWidth: 1, borderColor: C.border },
  kpiIcon: { width: 38, height: 38, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  kpiValue: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  kpiLabel: { fontSize: 10, fontWeight: '700', color: C.textSecondary, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Section
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 12, fontWeight: '700', color: C.primaryBlueMid },

  // Quick Actions
  quickRow: { flexDirection: 'row', gap: 10 },
  quickBtn: { flex: 1, borderRadius: RADIUS.md, padding: 14, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: C.border },
  quickLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Active Exam chips
  examChip: { width: 168, borderRadius: RADIUS.md, padding: 14, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...SHADOW.card },
  examChipLive: { borderColor: '#FECACA' },
  examLiveStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: C.error, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
  examChipName: { fontSize: 13, fontWeight: '800', color: C.textPrimary, marginBottom: 8 },
  examChipMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  examChipMetaText: { fontSize: 10, color: C.textMuted, fontWeight: '600' },
  examBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  examBadgeLive: { backgroundColor: C.errorBg },
  examBadgeDraft: { backgroundColor: C.bgAlt },
  examBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.error },
  examBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  // Chart
  chartCard: { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 18, ...SHADOW.md, borderWidth: 1, borderColor: C.border },
  chartTitle: { fontSize: 14, fontWeight: '900', color: C.textPrimary },
  chartSub: { fontSize: 11, color: C.textMuted, fontWeight: '500', marginTop: 2 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.successBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  trendText: { fontSize: 11, fontWeight: '800', color: C.success },

  // AI Card
  aiCard: { backgroundColor: '#0A0B14', borderRadius: RADIUS.xl, padding: 22, overflow: 'hidden', position: 'relative' },
  aiOrb: { position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: C.purple, opacity: 0.20 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiLabel: { fontSize: 10, fontWeight: '900', color: C.gold, letterSpacing: 1.5, textTransform: 'uppercase' },
  aiTip: { fontSize: 14, color: 'rgba(255,255,255,0.80)', lineHeight: 21, fontWeight: '500', minHeight: 60 },
  aiFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  aiNextBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  aiNextText: { fontSize: 12, fontWeight: '800', color: C.purple },
  aiDots: { flexDirection: 'row', gap: 5 },
  aiDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  aiDotActive: { backgroundColor: '#FFD700', width: 18 },

  // Create Exam CTA
  createExamBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#7C3AED', borderRadius: 18, paddingVertical: 16,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.30, shadowRadius: 14, elevation: 8,
  },
  createExamText: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
})
