import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native'

const SCREEN_W_val = Dimensions.get('window').width
import { useRouter } from 'expo-router'
import {
  BookOpen,
  CheckCircle,
  Clock,
  Play,
  Award,
  HelpCircle,
  X,
  Search,
  ChevronRight,
  Zap,
  Calendar,
} from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'
import { StudentHeader } from '../../../components/student/StudentHeader'

// ─── Types ───────────────────────────────────────────────────────────────────
interface AvailableExam {
  id: string
  name: string
  subject: string
  duration: number
  is_active?: boolean
  total_questions?: number
}

interface PastResult {
  id: string
  exam_name: string
  subject?: string
  score: number
  max: number
  date: string
}

type Tab = 'available' | 'upcoming' | 'results'

// ─── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ score, max, color }: { score: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0
  return (
    <View style={examStyles.scoreBarWrap}>
      <View style={examStyles.scoreTrack}>
        <View style={[examStyles.scoreFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[examStyles.scorePct, { color }]}>{pct}%</Text>
    </View>
  )
}

const examStyles = StyleSheet.create({
  scoreBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  scoreTrack: { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 99, overflow: 'hidden' },
  scoreFill: { height: 6, borderRadius: 99 },
  scorePct: { fontSize: 11, fontWeight: '900', minWidth: 34 },
})

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StudentExams() {
  const router = useRouter()
  const [activeTab, setActiveTab]     = useState<Tab>('available')
  const [loading, setLoading]         = useState(true)
  const [available, setAvailable]     = useState<AvailableExam[]>([])
  const [results, setResults]         = useState<PastResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExam, setSelectedExam] = useState<AvailableExam | null>(null)
  const [starting, setStarting]       = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/student/dashboard')
      setAvailable(data?.upcoming_exams || [])
      setResults(data?.recent_results || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleStartExam = async () => {
    if (!selectedExam) return
    setStarting(true)
    try {
      const response = await apiFetch('/api/student/exam/start', {
        method: 'POST',
        body: JSON.stringify({ exam_id: selectedExam.id }),
      })
      if (response?.attempt) {
        setSelectedExam(null)
        router.push(`/(student)/exams/attempt/${selectedExam.id}`)
      } else {
        throw new Error(response.error || 'Failed to start exam')
      }
    } catch (e: any) {
      Alert.alert('Attempt Blocked', e.message || 'You cannot start this exam right now.')
    } finally {
      setStarting(false)
    }
  }

  // Filtered data based on search
  const liveExams     = available.filter(e => e.is_active)
  const upcomingExams = available.filter(e => !e.is_active)

  const filteredAvailable = useMemo(() =>
    available.filter(e =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.subject || '').toLowerCase().includes(searchQuery.toLowerCase())
    ), [available, searchQuery])

  const filteredUpcoming = useMemo(() =>
    upcomingExams.filter(e =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.subject || '').toLowerCase().includes(searchQuery.toLowerCase())
    ), [upcomingExams, searchQuery])

  const filteredResults = useMemo(() =>
    results.filter(r =>
      r.exam_name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [results, searchQuery])

  const TABS: { key: Tab; label: string; count: number; color: string }[] = [
    { key: 'available', label: 'Available',  count: filteredAvailable.length, color: '#004B93' },
    { key: 'upcoming',  label: 'Upcoming',   count: filteredUpcoming.length,  color: '#7C3AED' },
    { key: 'results',   label: 'Completed',  count: filteredResults.length,   color: '#059669' },
  ]

  if (loading) {
    return (
      <View style={styles.container}>
        <StudentHeader />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading Exam Centre…</Text>
        </View>
      </View>
    )
  }

  const currentList =
    activeTab === 'available' ? filteredAvailable :
    activeTab === 'upcoming'  ? filteredUpcoming  :
    filteredResults

  return (
    <View style={styles.container}>
      <StudentHeader onSearch={setSearchQuery} searchPlaceholder="Search exams or subjects…" />

      {/* ── Exam Centre header ──────────────────────────── */}
      <View style={styles.examHeader}>
        <View style={styles.examHeaderLeft}>
          <BookOpen size={16} color="#004B93" />
          <Text style={styles.examHeaderTitle}>Exam Centre</Text>
        </View>
        {liveExams.length > 0 && (
          <View style={styles.liveCountBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveCountText}>{liveExams.length} Live</Text>
          </View>
        )}
      </View>

      {/* ── 3-Tab Bar ────────────────────────────────────── */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && { borderBottomColor: tab.color, borderBottomWidth: 2.5 }]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab.key ? tab.color : '#94A3B8', fontWeight: activeTab === tab.key ? '900' : '600' }]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabCount, { backgroundColor: activeTab === tab.key ? tab.color : '#E2E8F0' }]}>
                <Text style={[styles.tabCountText, { color: activeTab === tab.key ? '#FFF' : '#64748B' }]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Exam list ─────────────────────────────────────── */}
      <FlatList
        data={currentList as any[]}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <BookOpen size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No results for that search' :
               activeTab === 'available' ? 'No exams available right now' :
               activeTab === 'upcoming'  ? 'No upcoming exams scheduled' :
               'No completed exams yet'}
            </Text>
            <Text style={styles.emptySubtitle}>Check back later or clear your search</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (activeTab === 'results') {
            const res = item as PastResult
            const pct = res.max > 0 ? Math.round((res.score / res.max) * 100) : 0
            const scoreColor = pct >= 80 ? '#059669' : pct >= 50 ? '#F59E0B' : '#EF4444'
            return (
              <View style={styles.resultCard}>
                <View style={styles.resultLeft}>
                  <View style={[styles.resultIcon, { backgroundColor: scoreColor + '18' }]}>
                    <Award size={18} color={scoreColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName} numberOfLines={1}>{res.exam_name}</Text>
                    <Text style={styles.resultDate}>{res.date}</Text>
                    <ScoreBar score={res.score} max={res.max} color={scoreColor} />
                  </View>
                </View>
                <View style={styles.resultScore}>
                  <Text style={[styles.resultScoreVal, { color: scoreColor }]}>
                    {res.score}/{res.max}
                  </Text>
                  <Text style={styles.resultScorePct}>{pct}%</Text>
                </View>
              </View>
            )
          }

          const ex = item as AvailableExam
          const isLive = !!ex.is_active
          return (
            <TouchableOpacity
              onPress={() => setSelectedExam(ex)}
              style={[styles.examCard, isLive && styles.examCardLive]}
              activeOpacity={0.85}
            >
              {isLive && <View style={styles.liveStripe} />}
              <View style={styles.examCardTop}>
                <View style={[styles.examCardIcon, { backgroundColor: isLive ? '#FEF2F2' : '#EBF3FC' }]}>
                  {isLive
                    ? <Zap size={20} color="#EF4444" />
                    : <Calendar size={20} color="#004B93" />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.examName} numberOfLines={2}>{ex.name}</Text>
                  <Text style={styles.examSubject}>{ex.subject || 'General'}</Text>
                </View>
                {isLive && (
                  <View style={styles.liveTag}>
                    <View style={styles.livePulseDot} />
                    <Text style={styles.liveTagText}>LIVE</Text>
                  </View>
                )}
              </View>
              <View style={styles.examCardFooter}>
                <View style={styles.examMeta}>
                  <Clock size={12} color="#64748B" />
                  <Text style={styles.examMetaText}>{ex.duration || 60} mins</Text>
                </View>
                {(ex.total_questions ?? 0) > 0 && (
                  <View style={styles.examMeta}>
                    <HelpCircle size={12} color="#64748B" />
                    <Text style={styles.examMetaText}>{ex.total_questions} Qs</Text>
                  </View>
                )}
                <View style={{ flex: 1 }} />
                <View style={[styles.attemptBtn, { backgroundColor: isLive ? '#EF4444' : '#004B93' }]}>
                  <Text style={styles.attemptBtnText}>{isLive ? 'Start Now' : 'Attempt'}</Text>
                  <ChevronRight size={13} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          )
        }}
      />

      {/* ── Instructions Modal ─────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={!!selectedExam}
        onRequestClose={() => setSelectedExam(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            <View style={styles.modalTop}>
              <View>
                <Text style={styles.modalTitle}>Exam Instructions</Text>
                <Text style={styles.modalExamName} numberOfLines={1}>
                  {selectedExam?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedExam(null)} style={styles.modalClose}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Rules */}
            <View style={styles.rulesList}>
              {[
                `Time limit is ${selectedExam?.duration || 60} minutes.`,
                'Do not exit the application or switch apps during the attempt.',
                'The exam will auto-submit when the timer reaches zero.',
                'All answers are saved automatically as you proceed.',
              ].map((rule, i) => (
                <View key={i} style={styles.ruleRow}>
                  <CheckCircle size={14} color="#004B93" />
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>

            <View style={styles.modalMeta}>
              <View style={styles.metaPill}>
                <Clock size={13} color="#7C3AED" />
                <Text style={styles.metaPillText}>{selectedExam?.duration || 60} Minutes</Text>
              </View>
              {(selectedExam?.total_questions ?? 0) > 0 && (
                <View style={styles.metaPill}>
                  <HelpCircle size={13} color="#059669" />
                  <Text style={styles.metaPillText}>{selectedExam?.total_questions} Questions</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={handleStartExam}
              disabled={starting}
              style={styles.startBtn}
              activeOpacity={0.85}
            >
              {starting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Play size={18} color="#FFFFFF" />
                  <Text style={styles.startBtnText}>Begin Exam Attempt</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F6FF' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600' },

  examHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF2F8' },
  examHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  examHeaderTitle: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
  liveCountBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FEF2F2', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#FECACA' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444' },
  liveCountText: { fontSize: 11, fontWeight: '800', color: '#EF4444' },

  // Tabs
  tabRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF2F8' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 12 },
  tabCount: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
  tabCountText: { fontSize: 10, fontWeight: '900' },

  listContent: { padding: 16, paddingBottom: 32 },

  // Exam card
  examCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: '#EEF2F8',
    overflow: 'hidden',
  },
  examCardLive: { borderColor: '#FECACA', shadowColor: '#EF4444', shadowOpacity: 0.12 },
  liveStripe: { position: 'absolute', top: 0, left: 0, width: 4, height: '100%', backgroundColor: '#EF4444' },
  examCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  examCardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  examName: { fontSize: 14, fontWeight: '900', color: '#0F172A', lineHeight: 19 },
  examSubject: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 3 },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  livePulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  liveTagText: { fontSize: 9, fontWeight: '900', color: '#EF4444', letterSpacing: 0.8 },
  examCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  examMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  examMetaText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  attemptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  attemptBtnText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },

  // Result card
  resultCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: '#EEF2F8',
  },
  resultLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  resultIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  resultName: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  resultDate: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  resultScore: { alignItems: 'flex-end', marginLeft: 12 },
  resultScoreVal: { fontSize: 15, fontWeight: '900' },
  resultScorePct: { fontSize: 10, color: '#94A3B8', fontWeight: '700', marginTop: 2 },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#64748B', marginTop: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 6 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, borderRadius: 99, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20 },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  modalExamName: { fontSize: 18, fontWeight: '900', color: '#0F172A', maxWidth: SCREEN_W_val - 100 },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  rulesList: { backgroundColor: '#F8FAFF', borderRadius: 18, padding: 16, marginBottom: 16, gap: 10 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ruleText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 19, fontWeight: '500' },
  modalMeta: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0F6FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  metaPillText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#004B93', borderRadius: 18, paddingVertical: 16,
    shadowColor: '#004B93', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.30, shadowRadius: 14, elevation: 8,
  },
  startBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
})


