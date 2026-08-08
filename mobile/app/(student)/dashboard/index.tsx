import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useIdentity } from '../../../contexts/IdentityContext'
import {
  Award,
  BookOpen,
  ChevronRight,
  Video,
  FileText,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  Play,
  BarChart2,
  Wallet,
  Target,
  Users,
} from 'lucide-react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated'
import { apiFetch } from '../../../lib/api'
import { useExams } from '../../../hooks/useExams'
import { StudentHeader } from '../../../components/student/StudentHeader'
import { C, GRADIENT, SHADOW, RADIUS, CHART } from '../../../lib/theme'

const { width: SCREEN_W } = Dimensions.get('window')

// ─── Types ───────────────────────────────────────────────────────────────────
interface DashboardStats {
  credits: number
  avgScore: number
  completedExams: number
  liveToday: number
}

interface UpcomingExam {
  id: string
  name: string
  subject: string
  duration: number
  scheduled_at?: string
}

// ─── Live Pulse dot ───────────────────────────────────────────────────────────
function LivePulseDot() {
  const scale  = useSharedValue(1)
  const opac   = useSharedValue(1)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 800, easing: Easing.out(Easing.ease) }),
        withTiming(1,   { duration: 800 }),
      ), -1, false,
    )
    opac.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 800 }),
        withTiming(1,   { duration: 800 }),
      ), -1, false,
    )
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opac.value,
  }))

  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[styles.pulseDotRing, animStyle]} />
      <View style={styles.pulseDotCore} />
    </View>
  )
}

// ─── Animated stat card ───────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  delay,
}: {
  icon: React.ComponentType<{ size: number; color: string }>
  label: string
  value: string | number
  color: string
  bg: string
  delay: number
}) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(16)

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }))
    translateY.value = withDelay(delay, withSpring(0, { damping: 14 }))
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View style={[styles.statCard, animStyle]}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function AnimatedProgressBar({ percent, color }: { percent: number; color: string }) {
  const width = useSharedValue(0)

  useEffect(() => {
    width.value = withDelay(300, withTiming(percent, { duration: 1000, easing: Easing.out(Easing.quad) }))
  }, [percent])

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as any,
  }))

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { backgroundColor: color }, barStyle]} />
    </View>
  )
}

// ─── Upcoming Exam Card ───────────────────────────────────────────────────────
const SUBJECT_COLORS: Record<string, { bg: string; color: string }> = {
  Mathematics: { bg: C.primaryBlueLight,  color: C.primaryBlueMid },
  Physics:     { bg: C.primaryBlueLight,  color: C.primaryBlue    },
  Chemistry:   { bg: C.brandGreenLight,   color: C.brandGreen     },
  Biology:     { bg: '#FFF7ED',            color: '#F97316'        },
  English:     { bg: C.errorBg,           color: C.error          },
  History:     { bg: C.purpleLight,        color: C.purple         },
  default:     { bg: C.primaryBlueLight,  color: C.primaryBlueMid },
}

function subjectStyle(subject: string) {
  return SUBJECT_COLORS[subject] || SUBJECT_COLORS.default
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const router   = useRouter()
  const { user } = useIdentity()
  const [stats,   setStats]   = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
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

  useEffect(() => { fetchStats() }, [])

  // Derived values
  const firstName    = user?.fullName?.split(' ')[0] || 'Student'
  const userInitial  = user?.fullName?.charAt(0).toUpperCase() || 'S'
  const avgScore     = stats?.avgScore || 0
  const schoolName   = user?.tenant?.name || 'BeBrilliant Institute'
  const liveExams    = examData?.exams?.filter(e => e.is_active) || []
  const upcomingExams = examData?.exams?.filter(e => !e.is_active).slice(0, 5) || []

  // Badge
  let badgeName = 'Merit'
  let badgeColor = '#F59E0B'
  if (avgScore >= 90) { badgeName = 'Distinction'; badgeColor = '#059669' }
  else if (avgScore >= 80) { badgeName = 'Excellence'; badgeColor = '#7C3AED' }
  else if (avgScore < 60) { badgeName = 'Pass'; badgeColor = '#9CA3AF' }

  if (loading) {
    return (
      <View style={styles.container}>
        <StudentHeader />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.primaryBlueMid} />
          <Text style={styles.loadingText}>Syncing your portal…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <StudentHeader onSearch={setSearchQuery} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── SECTION 1: LIVE EXAMS ─────────────────────────────── */}
        {liveExams.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LivePulseDot />
              <Text style={[styles.sectionTitle, { color: C.error }]}>LIVE NOW</Text>
            </View>
            {liveExams.map((exam) => (
              <TouchableOpacity
                key={exam.id}
                style={styles.liveCard}
                onPress={() => router.push(`/(student)/exams/attempt/${exam.id}`)}
                activeOpacity={0.88}
              >
                <View style={styles.liveAccentBar} />
                <View style={{ flex: 1, paddingLeft: 14 }}>
                  <View style={styles.liveTagRow}>
                    <View style={styles.liveTag}>
                      <Text style={styles.liveTagText}>EXAM LIVE</Text>
                    </View>
                    <View style={styles.liveTimerBadge}>
                      <Clock size={11} color={C.error} />
                      <Text style={styles.liveTimerText}>
                        {exam.duration || 60} mins
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.liveExamName} numberOfLines={2}>
                    {exam.name}
                  </Text>
                  <Text style={styles.liveSubject}>{exam.subject || 'General'}</Text>
                </View>
                <View style={styles.startBtn}>
                  <Play size={16} color="#FFFFFF" />
                  <Text style={styles.startBtnText}>Start</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── SECTION 2: WELCOME CARD ────────────────────────────── */}
        <View style={styles.welcomeCard}>
          {/* Background orbs */}
          <View style={styles.welcomeOrbTR} />
          <View style={styles.welcomeOrbBL} />

          {/* Top row */}
          <View style={styles.welcomeTopRow}>
            <View>
              <Text style={styles.welcomeGreeting}>
                {getGreeting()}, {firstName} 👋
              </Text>
              <Text style={styles.welcomeSchool}>🏫 {schoolName}</Text>
            </View>
            <View style={styles.welcomeAvatar}>
              <Text style={styles.welcomeAvatarText}>{userInitial}</Text>
              <View style={[styles.welcomeBadgePill, { backgroundColor: badgeColor }]}>
                <Text style={styles.welcomeBadgeText}>{badgeName}</Text>
              </View>
            </View>
          </View>

          {/* Performance progress */}
          <View style={{ marginTop: 18 }}>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>Performance Score</Text>
              <Text style={styles.perfValue}>{avgScore}%</Text>
            </View>
            <AnimatedProgressBar percent={avgScore} color={C.brandGreen} />
          </View>

          {/* 3 inline stats */}
          <View style={styles.welcomeStatsRow}>
            <View style={styles.welcomeStat}>
              <Text style={styles.welcomeStatValue}>#{stats?.completedExams || 0}</Text>
              <Text style={styles.welcomeStatLabel}>Exams Done</Text>
            </View>
            <View style={styles.welcomeStatDivider} />
            <View style={styles.welcomeStat}>
              <Text style={styles.welcomeStatValue}>{avgScore}%</Text>
              <Text style={styles.welcomeStatLabel}>Avg Score</Text>
            </View>
            <View style={styles.welcomeStatDivider} />
            <View style={styles.welcomeStat}>
              <Text style={styles.welcomeStatValue}>5🔥</Text>
              <Text style={styles.welcomeStatLabel}>Day Streak</Text>
            </View>
          </View>
        </View>

        {/* ── SECTION 3: UPCOMING EXAMS ─────────────────────────── */}
        {upcomingExams.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>UPCOMING EXAMS</Text>
              <TouchableOpacity onPress={() => router.push('/(student)/exams')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {upcomingExams.map((exam, idx) => {
                const sc = subjectStyle(exam.subject || '')
                return (
                  <TouchableOpacity
                    key={exam.id}
                    style={[styles.upcomingCard, { backgroundColor: sc.bg }]}
                    onPress={() => router.push('/(student)/exams')}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.upcomingSubjectDot, { backgroundColor: sc.color }]} />
                    <Text style={[styles.upcomingSubject, { color: sc.color }]} numberOfLines={1}>
                      {exam.subject || 'General'}
                    </Text>
                    <Text style={styles.upcomingName} numberOfLines={2}>{exam.name}</Text>
                    <View style={styles.upcomingFooter}>
                      <Clock size={11} color="#64748B" />
                      <Text style={styles.upcomingDuration}>{exam.duration || 60} min</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        )}

        {/* ── SECTION 4: KPI STAT CARDS ──────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR PROGRESS</Text>
          <View style={styles.statsGrid}>
            <StatCard icon={BookOpen} label="Exams Done"  value={stats?.completedExams || 0} color={C.primaryBlueMid} bg={C.primaryBlueLight} delay={0} />
            <StatCard icon={Target}   label="Avg Score"   value={`${avgScore}%`}            color={C.brandGreen}    bg={C.brandGreenLight}  delay={80} />
            <StatCard icon={Video}    label="Live Today"   value={stats?.liveToday || 0}     color={C.purple}        bg={C.purpleLight}      delay={160} />
            <StatCard icon={Wallet}   label="Credits"      value={`₹${(stats?.credits || 0).toFixed(0)}`} color={C.warning} bg={C.warningBg} delay={240} />
          </View>
        </View>

        {/* ── SECTION 5: QUICK NAV TILES ─────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
          <View style={styles.quickGrid}>
            {[
              { label: 'My Exams',   icon: BookOpen,  color: C.primaryBlueMid, bg: C.primaryBlueLight, route: '/(student)/exams'    },
              { label: 'Analytics',  icon: BarChart2, color: C.brandGreen,     bg: C.brandGreenLight,  route: '/(student)/analytics'},
              { label: 'Study Vault',icon: FileText,  color: C.purple,         bg: C.purpleLight,      route: '/(student)/materials'},
              { label: 'Live Class', icon: Video,     color: C.error,          bg: C.errorBg,          route: '/(student)/live'     },
            ].map(({ label, icon: Icon, color, bg, route }) => (
              <TouchableOpacity
                key={label}
                style={[styles.quickTile, { backgroundColor: bg }]}
                onPress={() => router.push(route as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickTileIcon, { backgroundColor: color + '18' }]}>
                  <Icon size={22} color={color} />
                </View>
                <Text style={[styles.quickTileLabel, { color }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── SECTION 6: AI INSIGHT BANNER ───────────────────────── */}
        <View style={[styles.section, { paddingBottom: 0 }]}>
          <View style={styles.aiCard}>
            <View style={styles.aiOrbTR} />
            <View style={styles.aiHeader}>
              <Sparkles size={16} color="#FFD700" />
              <Text style={styles.aiLabel}>AI ACADEMIC INSIGHT</Text>
            </View>
            <Text style={styles.aiTitle}>Area of Improvement</Text>
            <Text style={styles.aiBody}>
              Keep attempting exams regularly to unlock personalised AI insights based on your performance patterns.
            </Text>
            <TouchableOpacity
              style={styles.aiCta}
              onPress={() => router.push('/(student)/analytics')}
              activeOpacity={0.85}
            >
              <Text style={styles.aiCtaText}>View Full Analytics</Text>
              <ChevronRight size={14} color={C.primaryBlueMid} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgAlt },          // official: #F7F8FA
  loadingText: { marginTop: 12, fontSize: 13, color: C.textSecondary, fontWeight: '600' },

  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.4, color: C.textSecondary, textTransform: 'uppercase', flex: 1 },
  seeAll: { fontSize: 11, fontWeight: '700', color: C.primaryBlueMid },

  // Live exam — official: error red #DC2626/#FEE2E2
  liveCard: {
    backgroundColor: C.bgCard,
    borderRadius: RADIUS.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    ...SHADOW.error,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  liveAccentBar: { width: 4, height: '100%', position: 'absolute', left: 0, top: 0, backgroundColor: C.error, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
  liveTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  liveTag: { backgroundColor: C.errorBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#FECACA' },
  liveTagText: { fontSize: 9, fontWeight: '900', color: C.error, letterSpacing: 1 },
  liveTimerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveTimerText: { fontSize: 11, fontWeight: '700', color: C.error },
  liveExamName: { fontSize: 15, fontWeight: '900', color: C.textPrimary, lineHeight: 20 },
  liveSubject: { fontSize: 11, color: C.textSecondary, fontWeight: '600', marginTop: 3 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.error, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: RADIUS.sm, marginLeft: 12,
    ...SHADOW.error,
  },
  startBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },

  // Pulse dot
  pulseDotCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.error, position: 'absolute' },
  pulseDotRing: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.error, position: 'absolute', opacity: 0.4 },

  // Welcome card — official: primary navy #1E3A8A
  welcomeCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: RADIUS.xxl,
    backgroundColor: C.primaryBlue,                   // #1E3A8A official deep navy
    padding: 22,
    overflow: 'hidden',
    ...SHADOW.brand,
  },
  welcomeOrbTR: { position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: C.primaryBlueMid, opacity: 0.30 },
  welcomeOrbBL: { position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: C.brandGreen, opacity: 0.20 },
  welcomeTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 },
  welcomeGreeting: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 },
  welcomeSchool: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 4 },
  welcomeAvatar: { alignItems: 'center' },
  welcomeAvatarText: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  welcomeBadgePill: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  welcomeBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5, textTransform: 'uppercase' },

  // Progress
  perfRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, zIndex: 2 },
  perfLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.60)' },
  perfValue: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 99 },

  // Welcome stats
  welcomeStatsRow: { flexDirection: 'row', marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', zIndex: 2 },
  welcomeStat: { flex: 1, alignItems: 'center' },
  welcomeStatValue: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  welcomeStatLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  welcomeStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Upcoming exam cards — official: white bg, #E5E7EB border, soft shadow
  upcomingCard: {
    width: 140,
    borderRadius: RADIUS.md,
    padding: 14,
    marginRight: 10,
    ...SHADOW.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  upcomingSubjectDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  upcomingSubject: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  upcomingName: { fontSize: 12, fontWeight: '800', color: C.textPrimary, lineHeight: 16 },
  upcomingFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  upcomingDuration: { fontSize: 10, color: C.textSecondary, fontWeight: '600' },

  // Stats grid — official: white card, #E5E7EB border
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: (SCREEN_W - 52) / 2,
    backgroundColor: C.bgCard,
    borderRadius: RADIUS.md,
    padding: 16,
    ...SHADOW.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  statIcon: { width: 40, height: 40, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: '900', color: C.textPrimary, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '700', color: C.textSecondary, marginTop: 2 },

  // Quick tiles
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickTile: {
    width: (SCREEN_W - 52) / 2,
    borderRadius: RADIUS.md,
    padding: 16,
    alignItems: 'flex-start',
    ...SHADOW.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickTileIcon: { width: 44, height: 44, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  quickTileLabel: { fontSize: 13, fontWeight: '800' },

  // AI insight — official: dark bg, primary orb, gold label, #EFF6FF AI blocks
  aiCard: {
    borderRadius: RADIUS.xl,
    backgroundColor: '#0A0B14',
    padding: 22,
    overflow: 'hidden',
    marginBottom: 10,
  },
  aiOrbTR: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: C.primaryBlue, opacity: 0.20 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  aiLabel: { fontSize: 9, fontWeight: '900', color: C.gold, letterSpacing: 1.5, textTransform: 'uppercase' },
  aiTitle: { fontSize: 17, fontWeight: '900', color: '#FFFFFF', marginBottom: 8 },
  aiBody: { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 18, fontWeight: '500' },
  aiCta: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: RADIUS.sm,
    paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start',
  },
  aiCtaText: { fontSize: 12, fontWeight: '800', color: C.primaryBlueMid },
})
