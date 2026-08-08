import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LineChart } from 'react-native-gifted-charts'
import {
  Award,
  Users,
  ChevronRight,
  X,
  Check,
  Calendar,
  HelpCircle,
  CheckCircle,
  BrainCircuit,
  Zap,
  TrendingUp,
  Sparkles,
  ShieldCheck,
} from 'lucide-react-native'
import { useIdentity } from '../../../contexts/IdentityContext'
import { useParentChildren } from '../../../hooks/useParentChildren'
import { useParentChildSummary } from '../../../hooks/useParentChildSummary'
import { ParentHeader } from '../../../components/parent/ParentHeader'
import { C, GRADIENT, SHADOW, RADIUS, CHART } from '../../../lib/theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const AI_PARENT_TIPS = [
  'Aarav score is 92% in Mathematics — highest percentile in standard 10.',
  'Attendance is at 98% this month. Great consistency!',
  'Physics exam scheduled next Tuesday. Review practice materials together.',
  'Top grade in Science test: 48/50 marks achieved.',
]

export default function ParentDashboard() {
  const router = useRouter()
  const { user } = useIdentity()
  const { data: children, isLoading: childrenLoading } = useParentChildren()
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [selectorVisible, setSelectorVisible] = useState(false)
  const [tipIdx, setTipIdx] = useState(0)

  useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id)
    }
  }, [children])

  const { data: summary, isLoading: summaryLoading } = useParentChildSummary(selectedChildId)

  const activeChild = children?.find(c => c.id === selectedChildId)
  const firstName = user?.fullName?.split(' ')[0] || 'Guardian'
  const activeChildName = activeChild ? `${activeChild.first_name} ${activeChild.last_name || ''}` : 'Child'

  // Chart data for attendance trajectory
  const lineData = [
    { value: 92, label: 'Jan' },
    { value: 95, label: 'Feb' },
    { value: 88, label: 'Mar' },
    { value: 96, label: 'Apr' },
    { value: 98, label: 'May' },
    { value: summary?.attendanceRate || 95, label: 'Jun', dataPointText: `${summary?.attendanceRate || 95}%` },
  ]

  if (childrenLoading) {
    return (
      <View style={s.container}>
        <ParentHeader showSearch={false} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.brandGreen} />
          <Text style={s.loadingText}>Opening Guardian Portal…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <ParentHeader
        activeChildName={activeChildName}
        onSwitchChildPress={() => setSelectorVisible(true)}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        {/* Emerald Guardian Hero */}
        <View style={s.heroCard}>
          <View style={s.heroBadge}>
            <ShieldCheck size={12} color="#A7F3D0" />
            <Text style={s.heroBadgeText}>GUARDIAN OVERSIGHT ONLINE</Text>
          </View>
          <Text style={s.heroGreet}>Welcome back,</Text>
          <Text style={s.heroName}>{firstName} 👋</Text>
          <Text style={s.heroSub}>{user?.tenant?.name || 'BeBrilliant Education'} · Parent Hub</Text>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          {/* Linked Student Selector Card */}
          {children && children.length > 0 ? (
            <TouchableOpacity
              style={s.childCard}
              onPress={() => setSelectorVisible(true)}
              activeOpacity={0.85}
            >
              <View style={s.childAvatar}>
                <Text style={s.childAvatarText}>
                  {activeChild?.first_name?.charAt(0) || 'S'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.childLabel}>LINKED STUDENT (TAP TO SWITCH)</Text>
                <Text style={s.childName}>{activeChildName}</Text>
                <Text style={s.childSub}>
                  Class {(activeChild?.metadata as any)?.school_class || 'Standard 10'} · Section {(activeChild?.metadata as any)?.division || 'A'}
                </Text>
              </View>
              <ChevronRight size={18} color="#059669" />
            </TouchableOpacity>
          ) : (
            <View style={s.noChildCard}>
              <Users size={24} color="#94A3B8" />
              <Text style={s.noChildText}>No linked student accounts found</Text>
            </View>
          )}

          {summaryLoading && selectedChildId ? (
            <View style={{ paddingVertical: 40, alignItems: 'center', marginTop: 24 }}>
              <ActivityIndicator size="large" color={C.brandGreen} />
              <Text style={{ marginTop: 10, fontSize: 12, color: C.textSecondary, fontWeight: '600' }}>
                Updating Child Progress…
              </Text>
            </View>
          ) : (
            summary && (
              <>
                {/* 4 KPI Tiles Grid */}
                <View style={s.kpiGrid}>
                  <View style={[s.kpiCard, { backgroundColor: C.brandGreenLight }]}>
                    <Calendar size={18} color={C.brandGreen} />
                    <Text style={[s.kpiVal, { color: C.brandGreen }]}>{summary.attendanceRate}%</Text>
                    <Text style={s.kpiLbl}>Attendance Rate</Text>
                  </View>
                  <View style={[s.kpiCard, { backgroundColor: C.primaryBlueLight }]}>
                    <Award size={18} color={C.primaryBlueMid} />
                    <Text style={[s.kpiVal, { color: C.primaryBlueMid }]}>{summary.avgScore}%</Text>
                    <Text style={s.kpiLbl}>Average Grade</Text>
                  </View>
                  <View style={[s.kpiCard, { backgroundColor: C.purpleLight }]}>
                    <Award size={18} color={C.purple} />
                    <Text style={[s.kpiVal, { color: C.purple }]}>{summary.completedExams}</Text>
                    <Text style={s.kpiLbl}>Exams Completed</Text>
                  </View>
                  <View style={[s.kpiCard, { backgroundColor: C.errorBg }]}>
                    <X size={18} color={C.error} />
                    <Text style={[s.kpiVal, { color: C.error }]}>{summary.absentCount}</Text>
                    <Text style={s.kpiLbl}>Days Absent</Text>
                  </View>
                </View>

                {/* Attendance Trajectory Chart */}
                <View style={s.chartCard}>
                  <View style={s.chartHeader}>
                    <View>
                      <Text style={s.chartTitle}>Attendance Trajectory</Text>
                      <Text style={s.chartSub}>Monthly Attendance % Trend</Text>
                    </View>
                    <View style={s.trendBadge}>
                      <TrendingUp size={11} color={C.success} />
                      <Text style={s.trendText}>Consistent</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'center', marginTop: 12 }}>
                    <LineChart
                      data={lineData}
                      height={150}
                      width={SCREEN_WIDTH - 72}
                      color={C.brandGreen}
                      thickness={3}
                      dataPointsColor={C.brandGreen}
                      dataPointsRadius={5}
                      curved
                      areaChart
                      startFillColor={CHART.successFill}
                      endFillColor="rgba(12,163,92,0)"
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

                {/* AI Parent Advisor Card */}
                <View style={s.aiCard}>
                  <View style={s.aiHeader}>
                    <BrainCircuit size={18} color="#FFD700" />
                    <Text style={s.aiLabel}>AI PARENT ADVISOR</Text>
                  </View>
                  <Text style={s.aiTip}>{AI_PARENT_TIPS[tipIdx]}</Text>
                  <View style={s.aiFooter}>
                    <TouchableOpacity
                      style={s.aiNextBtn}
                      onPress={() => setTipIdx(i => (i + 1) % AI_PARENT_TIPS.length)}
                    >
                      <Zap size={12} color="#059669" />
                      <Text style={s.aiNextText}>Next Insight</Text>
                    </TouchableOpacity>
                    <View style={s.aiDots}>
                      {AI_PARENT_TIPS.map((_, i) => (
                        <View key={i} style={[s.aiDot, i === tipIdx && s.aiDotActive]} />
                      ))}
                    </View>
                  </View>
                </View>

                {/* Recent Assessment Results */}
                <View style={s.sectionCard}>
                  <View style={s.rowBetween}>
                    <Text style={s.sectionTitle}>RECENT ASSESSMENT RESULTS</Text>
                    <TouchableOpacity onPress={() => router.push('/(parent)/children')} style={s.seeAll}>
                      <Text style={s.seeAllText}>View All</Text>
                      <ChevronRight size={13} color="#059669" />
                    </TouchableOpacity>
                  </View>

                  {summary.recentScores.length > 0 ? (
                    summary.recentScores.map((score, idx) => (
                      <View
                        key={score.id || idx}
                        style={[s.scoreRow, idx < summary.recentScores.length - 1 && s.scoreBorder]}
                      >
                        <View style={{ flex: 1, paddingRight: 12 }}>
                          <Text style={s.examName} numberOfLines={1}>
                            {score.exam_name}
                          </Text>
                          <Text style={s.examSub}>
                            Subject: {score.subject} · {new Date(score.exam_date).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={s.marksText}>
                            {score.marks_obtained}/{score.total_marks}
                          </Text>
                          <Text style={s.pctText}>{score.percentage}% grade</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                      <HelpCircle size={28} color="#9CA3AF" />
                      <Text style={{ marginTop: 8, fontSize: 12, color: '#64748B', fontWeight: '600' }}>
                        No exam scores recorded yet
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )
          )}
        </View>
      </ScrollView>

      {/* Child Selector Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectorVisible}
        onRequestClose={() => setSelectorVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select Student</Text>
              <TouchableOpacity onPress={() => setSelectorVisible(false)} style={s.modalClose}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={children}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedChildId
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedChildId(item.id)
                      setSelectorVisible(false)
                    }}
                    style={[s.childPickerItem, isSelected && s.childPickerItemActive]}
                  >
                    <View style={s.pickerAvatar}>
                      <Text style={s.pickerAvatarText}>{(item.first_name ?? '?').charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.pickerName, isSelected && { color: C.brandGreen }]}>
                        {item.first_name} {item.last_name || ''}
                      </Text>
                      <Text style={s.pickerEmail}>{item.email}</Text>
                    </View>
                    {isSelected && <Check size={18} color={C.brandGreen} />}
                  </TouchableOpacity>
                )
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgAlt },          // official: #F7F8FA
  loadingText: { marginTop: 12, fontSize: 13, color: C.textSecondary, fontWeight: '600' },

  // Hero card — official: deep navy #1E3A8A (brand primary)
  heroCard: { backgroundColor: C.primaryBlue, padding: 24, position: 'relative' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 },
  heroBadgeText: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.80)', letterSpacing: 1 },
  heroGreet: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  heroName: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 4 },

  // Child card — official: white, #E5E7EB border, brand green accent
  childCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 16, borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  childAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.brandGreen, alignItems: 'center', justifyContent: 'center' },
  childAvatarText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  childLabel: { fontSize: 9, fontWeight: '900', color: C.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  childName: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginTop: 2 },
  childSub: { fontSize: 11, color: C.textSecondary, fontWeight: '500', marginTop: 2 },
  noChildCard: { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  noChildText: { fontSize: 13, fontWeight: '700', color: C.textSecondary, marginTop: 8 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  kpiCard: { width: '48%', borderRadius: RADIUS.md, padding: 14, gap: 4, borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  kpiVal: { fontSize: 22, fontWeight: '900' },
  kpiLbl: { fontSize: 9, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Chart card — official: white, soft shadow
  chartCard: { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 16, marginTop: 14, ...SHADOW.card, borderWidth: 1, borderColor: C.border },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartTitle: { fontSize: 14, fontWeight: '900', color: C.textPrimary },
  chartSub: { fontSize: 10, color: C.textMuted, fontWeight: '600', marginTop: 2 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.successBg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  trendText: { fontSize: 10, fontWeight: '800', color: C.success },

  // AI card — official: dark bg, gold label (#FFD486), brand green 'Next Insight'
  aiCard: { backgroundColor: '#0F172A', borderRadius: RADIUS.lg, padding: 18, marginTop: 14 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  aiLabel: { fontSize: 10, fontWeight: '900', color: C.gold, letterSpacing: 1.5 },
  aiTip: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 19, fontWeight: '500', minHeight: 44 },
  aiFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  aiNextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  aiNextText: { fontSize: 11, fontWeight: '800', color: C.brandGreen },
  aiDots: { flexDirection: 'row', gap: 4 },
  aiDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  aiDotActive: { width: 16, backgroundColor: C.gold },

  // Section card — official: white, #E5E7EB border
  sectionCard: { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 16, marginTop: 14, ...SHADOW.card, borderWidth: 1, borderColor: C.border },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4, color: C.textSecondary, textTransform: 'uppercase' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 12, fontWeight: '700', color: C.brandGreen },

  // Score rows
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  scoreBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  examName: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  examSub: { fontSize: 10, color: C.textMuted, fontWeight: '500', marginTop: 2 },
  marksText: { fontSize: 13, fontWeight: '900', color: C.brandGreen },
  pctText: { fontSize: 10, fontWeight: '700', color: C.textSecondary, marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.bgCard, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bgAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  childPickerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  childPickerItemActive: { backgroundColor: C.brandGreenLight, paddingHorizontal: 12, borderRadius: RADIUS.sm, borderBottomWidth: 0 },
  pickerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.brandGreen, alignItems: 'center', justifyContent: 'center' },
  pickerAvatarText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  pickerName: { fontSize: 14, fontWeight: '800', color: C.textPrimary },
  pickerEmail: { fontSize: 11, color: C.textSecondary, fontWeight: '500', marginTop: 2 },
})
