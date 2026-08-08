import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet, TextInput, Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  BookOpen, Plus, Search, Trash2, Eye, Zap,
  Clock, HelpCircle, ChevronRight, CheckCircle, XCircle,
} from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'
import { TeacherHeader } from '../../../components/teacher/TeacherHeader'

const { width: SCREEN_W } = Dimensions.get('window')

type Tab = 'all' | 'live' | 'draft'
type Exam = {
  id: string; name: string; is_active: boolean; duration?: number; is_paid: boolean; price: number
  exam_config?: { total_questions: number }; created_at: string
}

export default function TeacherExams() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchExams = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/dashboard/exams/online')
      setExams(data?.exams || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchExams() }, [fetchExams])

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Exam', `Remove "${name}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await apiFetch('/api/dashboard/exams/online', {
              method: 'POST', body: JSON.stringify({ action: 'DELETE_EXAM', payload: { id } }),
            })
            fetchExams()
          } catch { Alert.alert('Error', 'Could not delete exam') }
        },
      },
    ])
  }

  const handleToggle = async (exam: Exam) => {
    setToggling(exam.id)
    try {
      await apiFetch('/api/dashboard/exams/online', {
        method: 'POST',
        body: JSON.stringify({ action: 'TOGGLE_STATUS', payload: { id: exam.id, is_active: !exam.is_active } }),
      })
      fetchExams()
    } catch { Alert.alert('Error', 'Could not update exam status') }
    finally { setToggling(null) }
  }

  const filtered = useMemo(() => {
    let list = exams
    if (tab === 'live')  list = list.filter(e => e.is_active)
    if (tab === 'draft') list = list.filter(e => !e.is_active)
    if (search) list = list.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [exams, tab, search])

  const liveCount  = exams.filter(e => e.is_active).length
  const draftCount = exams.filter(e => !e.is_active).length

  const TABS: { key: Tab; label: string; count: number; color: string }[] = [
    { key: 'all',   label: 'All',   count: exams.length, color: '#7C3AED' },
    { key: 'live',  label: 'Live',  count: liveCount,    color: '#EF4444' },
    { key: 'draft', label: 'Draft', count: draftCount,   color: '#94A3B8' },
  ]

  if (loading) {
    return (
      <View style={s.container}>
        <TeacherHeader showSearch={false} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={s.loadingText}>Loading Exams…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <TeacherHeader onSearch={setSearch} searchPlaceholder="Search exams…" />

      {/* Subheader */}
      <View style={s.subHeader}>
        <BookOpen size={16} color="#7C3AED" />
        <Text style={s.subTitle}>Exam Management</Text>
        {liveCount > 0 && (
          <View style={s.liveChip}>
            <View style={s.liveDot} />
            <Text style={s.liveChipText}>{liveCount} Live</Text>
          </View>
        )}
      </View>

      {/* Tab bar */}
      <View style={s.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && { borderBottomColor: t.color, borderBottomWidth: 2.5 }]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabLabel, { color: tab === t.key ? t.color : '#94A3B8', fontWeight: tab === t.key ? '900' : '600' }]}>
              {t.label}
            </Text>
            {t.count > 0 && (
              <View style={[s.tabBadge, { backgroundColor: tab === t.key ? t.color : '#E2E8F0' }]}>
                <Text style={[s.tabBadgeText, { color: tab === t.key ? '#FFF' : '#64748B' }]}>{t.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={ex => ex.id}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <BookOpen size={44} color="#CBD5E1" />
            <Text style={s.emptyTitle}>{search ? 'No results found' : 'No exams yet'}</Text>
            <Text style={s.emptySub}>Tap + to create your first exam</Text>
          </View>
        }
        renderItem={({ item: ex }) => (
          <View style={[s.examCard, ex.is_active && s.examCardLive]}>
            {ex.is_active && <View style={s.liveStripe} />}

            <View style={s.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.examName} numberOfLines={2}>{ex.name}</Text>
                <View style={s.metaRow}>
                  <Clock size={11} color="#94A3B8" />
                  <Text style={s.metaText}>{ex.duration ?? 60} mins</Text>
                  {(ex.exam_config?.total_questions ?? 0) > 0 && <>
                    <HelpCircle size={11} color="#94A3B8" />
                    <Text style={s.metaText}>{ex.exam_config!.total_questions} Qs</Text>
                  </>}
                  {ex.is_paid && (
                    <View style={s.paidTag}>
                      <Text style={s.paidText}>₹{ex.price}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Status toggle */}
              <TouchableOpacity
                onPress={() => handleToggle(ex)}
                disabled={toggling === ex.id}
                style={[s.statusPill, ex.is_active ? s.statusLive : s.statusDraft]}
              >
                {toggling === ex.id
                  ? <ActivityIndicator size="small" color={ex.is_active ? '#EF4444' : '#94A3B8'} />
                  : ex.is_active
                    ? <><View style={s.statusDot} /><Text style={s.statusTextLive}>LIVE</Text></>
                    : <Text style={s.statusTextDraft}>DRAFT</Text>
                }
              </TouchableOpacity>
            </View>

            <View style={s.cardActions}>
              <TouchableOpacity
                style={s.actionBtn}
                onPress={() => handleDelete(ex.id, ex.name)}
              >
                <Trash2 size={15} color="#EF4444" />
                <Text style={s.actionBtnText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, s.actionBtnPrimary]}
                onPress={() => router.push(`/(teacher)/exams/${ex.id}` as any)}
              >
                <Eye size={15} color="#7C3AED" />
                <Text style={[s.actionBtnText, { color: '#7C3AED' }]}>Open</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => router.push('/(teacher)/exams/create')} activeOpacity={0.85}>
        <Plus size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600' },

  subHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF2F8' },
  subTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', flex: 1 },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FEF2F2', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#FECACA' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  liveChipText: { fontSize: 11, fontWeight: '800', color: '#EF4444' },

  tabRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF2F8' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 12 },
  tabBadge: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  tabBadgeText: { fontSize: 10, fontWeight: '900' },

  listContent: { padding: 16, paddingBottom: 96 },

  examCard: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#EEF2F8', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  examCardLive: { borderColor: '#FECACA', shadowColor: '#EF4444', shadowOpacity: 0.10 },
  liveStripe: { position: 'absolute', top: 0, left: 0, width: 4, height: '100%', backgroundColor: '#EF4444' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, paddingLeft: 20 },
  examName: { fontSize: 14, fontWeight: '800', color: '#0F172A', lineHeight: 19, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  paidTag: { backgroundColor: '#FFFBEB', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  paidText: { fontSize: 10, fontWeight: '900', color: '#D97706' },
  statusPill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60, justifyContent: 'center' },
  statusLive: { backgroundColor: '#FEF2F2' },
  statusDraft: { backgroundColor: '#F1F5F9' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  statusTextLive: { fontSize: 10, fontWeight: '900', color: '#EF4444' },
  statusTextDraft: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', padding: 12, gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#EEF2F8' },
  actionBtnPrimary: { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#64748B', marginTop: 16 },
  emptySub: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 4 },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#7C3AED',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.40, shadowRadius: 16, elevation: 10,
  },
})
