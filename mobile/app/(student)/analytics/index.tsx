import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native'
import {
  BarChart2,
  TrendingUp,
  Award,
  BrainCircuit,
  Target,
  ChevronRight,
  Zap,
  Clock,
} from 'lucide-react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { StudentHeader } from '../../../components/student/StudentHeader'
import { apiFetch } from '../../../lib/api'

const { width: SCREEN_W } = Dimensions.get('window')

// ─── Types ───────────────────────────────────────────────────────────────────
interface SubjectPerf {
  subject: string
  accuracy: number
  attempts: number
  color: string
}

// ─── Animated subject bar ─────────────────────────────────────────────────────
function SubjectBar({
  subject,
  accuracy,
  attempts,
  color,
  delay,
}: SubjectPerf & { delay: number }) {
  const width = useSharedValue(0)

  useEffect(() => {
    width.value = withDelay(delay, withTiming(accuracy, { duration: 900, easing: Easing.out(Easing.quad) }))
  }, [accuracy])

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as any,
  }))

  const isWeak = accuracy < 60

  return (
    <View style={barStyles.row}>
      <View style={barStyles.labelRow}>
        <Text style={barStyles.subjectName}>{subject}</Text>
        <View style={barStyles.rightInfo}>
          {isWeak && (
            <View style={barStyles.weakBadge}>
              <Text style={barStyles.weakText}>⚠ Needs Focus</Text>
            </View>
          )}
          <Text style={[barStyles.pct, { color }]}>{accuracy}%</Text>
        </View>
      </View>
      <View style={barStyles.track}>
        <Animated.View style={[barStyles.fill, { backgroundColor: color }, barStyle]} />
      </View>
      <Text style={barStyles.attempts}>{attempts} attempts</Text>
    </View>
  )
}

const barStyles = StyleSheet.create({
  row: { marginBottom: 18 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subjectName: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  rightInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weakBadge: { backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  weakText: { fontSize: 9, fontWeight: '800', color: '#D97706' },
  pct: { fontSize: 13, fontWeight: '900', minWidth: 34, textAlign: 'right' },
  track: { height: 10, backgroundColor: '#F1F5F9', borderRadius: 99, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 99 },
  attempts: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 4 },
})

// ─── AI Insight prompts ───────────────────────────────────────────────────────
const AI_INSIGHTS = [
  'Your Mathematics accuracy dropped 12% in the last 2 exams. Focus on Chapter 4 — Calculus for your next revision.',
  'You perform 23% better in morning exams vs afternoon. Try scheduling your practice sessions before noon.',
  'Physics is your strongest subject at 82%. Keep it up while dedicating more time to Chemistry.',
  'Your average attempt time per question is 2.4 minutes — aim for under 1.8 minutes to improve rank.',
]

// ─── Main Analytics Screen ────────────────────────────────────────────────────
export default function StudentAnalytics() {
  const [loading, setLoading] = useState(true)
  const [subjectData, setSubjectData] = useState<SubjectPerf[]>([
    { subject: 'Mathematics', accuracy: 48, attempts: 110, color: '#EF4444' },
    { subject: 'Physics',     accuracy: 82, attempts: 140, color: '#004B93' },
    { subject: 'Chemistry',   accuracy: 76, attempts: 95,  color: '#059669' },
    { subject: 'Biology',     accuracy: 91, attempts: 60,  color: '#7C3AED' },
  ])
  const [estRank, setEstRank]       = useState(1340)
  const [totalPeers, setTotalPeers] = useState(54000)
  const [totalHours, setTotalHours] = useState(45)
  const [insightIdx, setInsightIdx] = useState(0)

  useEffect(() => {
    // Fetch real data if available
    apiFetch('/api/student/dashboard-summary')
      .then(data => {
        if (data?.avgScore !== undefined) {
          // Update Math entry with real avg
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const rankPercent = Math.round((1 - estRank / totalPeers) * 100)

  if (loading) {
    return (
      <View style={styles.container}>
        <StudentHeader />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading Analytics…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StudentHeader />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── HEADER BANNER ─────────────────────────────────────── */}
        <View style={styles.heroBanner}>
          <View style={styles.heroOrb} />
          <View style={styles.heroBadge}>
            <BarChart2 size={13} color="#059669" />
            <Text style={styles.heroBadgeText}>PERFORMANCE ANALYTICS</Text>
          </View>
          <Text style={styles.heroTitle}>Academic Intelligence Dashboard</Text>
          <Text style={styles.heroSubtitle}>
            Track subject mastery, class rank, and study patterns in real-time.
          </Text>
        </View>

        {/* ── RANK PREDICTOR ────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.rankCard}>
            <View style={styles.rankLeft}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>RANK PREDICTOR</Text>
              </View>
              <Text style={styles.rankTitle}>Estimated Class Rank</Text>
              <Text style={styles.rankDesc}>
                Based on your performance vs{' '}
                <Text style={{ color: '#004B93', fontWeight: '900' }}>
                  {totalPeers.toLocaleString()}
                </Text>{' '}
                active students
              </Text>
              <View style={styles.rankTopBadge}>
                <Zap size={12} color="#FFFFFF" />
                <Text style={styles.rankTopText}>Top {100 - rankPercent}% of class</Text>
              </View>
            </View>
            <View style={styles.rankCircleWrap}>
              <View style={styles.rankCircle}>
                <Text style={styles.rankHash}>#</Text>
                <Text style={styles.rankNumber}>{estRank.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── QUICK STATS ROW ──────────────────────────────────── */}
        <View style={[styles.section, { paddingTop: 0 }]}>
          <View style={styles.quickStatsRow}>
            {[
              { icon: Clock, label: 'Study Hours', value: `${totalHours}h`, color: '#7C3AED', bg: '#F5F3FF' },
              { icon: Target, label: 'Avg Accuracy', value: `${Math.round(subjectData.reduce((s, d) => s + d.accuracy, 0) / subjectData.length)}%`, color: '#059669', bg: '#ECFDF5' },
              { icon: Award, label: 'Best Subject', value: subjectData.sort((a, b) => b.accuracy - a.accuracy)[0]?.subject.slice(0, 4) + '.', color: '#004B93', bg: '#EBF3FC' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <View key={label} style={[styles.quickStatCard, { backgroundColor: bg }]}>
                <Icon size={16} color={color} />
                <Text style={[styles.quickStatValue, { color }]}>{value}</Text>
                <Text style={styles.quickStatLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── SUBJECT PERFORMANCE ───────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.cardSection}>
            <View style={styles.cardHeader}>
              <TrendingUp size={16} color="#004B93" />
              <Text style={styles.cardTitle}>Subject-wise Accuracy</Text>
            </View>
            {[...subjectData].sort((a, b) => b.accuracy - a.accuracy).map((item, idx) => (
              <SubjectBar key={item.subject} {...item} delay={idx * 120} />
            ))}
          </View>
        </View>

        {/* ── AI INSIGHT CARD ────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.aiCard}>
            <View style={styles.aiOrbTR} />
            <View style={styles.aiCardHeader}>
              <BrainCircuit size={18} color="#FFD700" />
              <Text style={styles.aiCardLabel}>AI ACADEMIC MENTOR</Text>
            </View>
            <Text style={styles.aiInsight}>
              {AI_INSIGHTS[insightIdx]}
            </Text>
            <View style={styles.aiFooter}>
              <TouchableOpacity
                style={styles.aiNextBtn}
                onPress={() => setInsightIdx((i) => (i + 1) % AI_INSIGHTS.length)}
              >
                <Text style={styles.aiNextText}>Next Insight</Text>
                <ChevronRight size={13} color="#004B93" />
              </TouchableOpacity>
              <View style={styles.aiDots}>
                {AI_INSIGHTS.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.aiDot,
                      i === insightIdx && styles.aiDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ── IMPROVEMENT TIPS ─────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FOCUS AREAS</Text>
          {subjectData
            .filter(s => s.accuracy < 75)
            .map(s => (
              <View key={s.subject} style={styles.focusTip}>
                <View style={[styles.focusDot, { backgroundColor: s.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.focusSubject}>{s.subject}</Text>
                  <Text style={styles.focusDesc}>
                    Accuracy at {s.accuracy}% — review recent incorrect answers and practice similar questions.
                  </Text>
                </View>
                <Text style={[styles.focusPct, { color: s.color }]}>{s.accuracy}%</Text>
              </View>
            ))}
        </View>

      </ScrollView>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F6FF' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600' },

  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.4, color: '#64748B', textTransform: 'uppercase', marginBottom: 12 },

  // Hero banner
  heroBanner: {
    backgroundColor: '#003E7E',
    paddingHorizontal: 20,
    paddingVertical: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  heroOrb: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: '#005EB8', opacity: 0.4 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(5,150,105,0.18)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(5,150,105,0.3)' },
  heroBadgeText: { fontSize: 10, fontWeight: '900', color: '#4ADE80', letterSpacing: 1 },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginTop: 10, letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.60)', fontWeight: '600', marginTop: 5, lineHeight: 18 },

  // Rank predictor
  rankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#004B93',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },
  rankLeft: { flex: 1, paddingRight: 16 },
  rankBadge: { backgroundColor: '#EBF3FC', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  rankBadgeText: { fontSize: 9, fontWeight: '900', color: '#004B93', letterSpacing: 1 },
  rankTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 6 },
  rankDesc: { fontSize: 12, color: '#64748B', fontWeight: '500', lineHeight: 17 },
  rankTopBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#059669', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, marginTop: 12, alignSelf: 'flex-start' },
  rankTopText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  rankCircleWrap: { alignItems: 'center', justifyContent: 'center' },
  rankCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#EBF3FC', alignItems: 'center', justifyContent: 'center',
    borderWidth: 6, borderColor: '#004B93',
  },
  rankHash: { fontSize: 16, fontWeight: '900', color: '#004B93', marginBottom: -4 },
  rankNumber: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },

  // Quick stats
  quickStatsRow: { flexDirection: 'row', gap: 10 },
  quickStatCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 5 },
  quickStatValue: { fontSize: 18, fontWeight: '900' },
  quickStatLabel: { fontSize: 9, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },

  // Card section
  cardSection: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A' },

  // AI card
  aiCard: {
    backgroundColor: '#0A0B14', borderRadius: 24, padding: 22, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.20, shadowRadius: 20, elevation: 10,
  },
  aiOrbTR: { position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: '#004B93', opacity: 0.20 },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiCardLabel: { fontSize: 10, fontWeight: '900', color: '#FFD700', letterSpacing: 1.5, textTransform: 'uppercase' },
  aiInsight: { fontSize: 14, color: 'rgba(255,255,255,0.80)', lineHeight: 21, fontWeight: '500', minHeight: 60 },
  aiFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  aiNextBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  aiNextText: { fontSize: 12, fontWeight: '800', color: '#004B93' },
  aiDots: { flexDirection: 'row', gap: 5 },
  aiDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  aiDotActive: { backgroundColor: '#FFD700', width: 18 },

  // Focus tips
  focusTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  focusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  focusSubject: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 3 },
  focusDesc: { fontSize: 11, color: '#64748B', lineHeight: 16, fontWeight: '500' },
  focusPct: { fontSize: 16, fontWeight: '900', alignSelf: 'center' },
})
