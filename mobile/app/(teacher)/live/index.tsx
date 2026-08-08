import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet, TextInput, Modal, ScrollView, Switch,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import {
  Video, Plus, X, Calendar, Clock, DownloadCloud,
  ExternalLink, PhoneCall, CheckCircle, Server,
} from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'
import { TeacherHeader } from '../../../components/teacher/TeacherHeader'

interface LiveClass {
  id: string
  title: string
  scheduled_at: string
  duration_minutes: number
  status: 'live' | 'scheduled' | 'completed' | string
  join_url: string
  auto_record: boolean
  teacher?: { first_name: string; last_name: string }
}

export default function TeacherLiveClasses() {
  const router = useRouter()
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [duration, setDuration] = useState('60')
  const [autoRecord, setAutoRecord] = useState(true)

  const fetchClasses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/dashboard/live')
      setClasses(res?.classes || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const handleSchedule = async () => {
    if (!title.trim()) {
      return Alert.alert('Required', 'Please enter a session title.')
    }
    setSaving(true)
    try {
      const scheduled_at = date.trim() || new Date(Date.now() + 3600000).toISOString()
      await apiFetch('/api/dashboard/live', {
        method: 'POST',
        body: JSON.stringify({
          action: 'SCHEDULE_CLASS',
          payload: {
            title,
            date: scheduled_at,
            duration: parseInt(duration) || 60,
            auto_record: autoRecord,
          },
        }),
      })
      Alert.alert('✅ Scheduled!', 'Live session initialized.')
      setShowModal(false)
      setTitle('')
      fetchClasses()
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not schedule live session.')
    } finally {
      setSaving(false)
    }
  }

  const handleLaunch = async (cls: LiveClass) => {
    try {
      await apiFetch('/api/dashboard/live', {
        method: 'POST',
        body: JSON.stringify({ action: 'LAUNCH_CLASS', payload: { id: cls.id } }),
      })
      if (cls.join_url) {
        WebBrowser.openBrowserAsync(cls.join_url)
      }
      fetchClasses()
    } catch {
      if (cls.join_url) WebBrowser.openBrowserAsync(cls.join_url)
    }
  }

  const liveCount = classes.filter(c => c.status === 'live').length
  const recordedCount = classes.filter(c => c.auto_record).length

  if (loading && classes.length === 0) {
    return (
      <View style={s.container}>
        <TeacherHeader showSearch={false} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={s.loadingText}>Connecting Live Synapse…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <TeacherHeader showSearch={false} />

      {/* Header bar */}
      <View style={s.subHeader}>
        <Video size={16} color="#EF4444" />
        <Text style={s.subTitle}>Live Synapse Sessions</Text>
        {liveCount > 0 && (
          <View style={s.liveChip}>
            <View style={s.liveDot} />
            <Text style={s.liveChipText}>{liveCount} Active</Text>
          </View>
        )}
      </View>

      {/* KPI Tiles */}
      <View style={s.kpiRow}>
        <View style={[s.kpiCard, { backgroundColor: '#FEF2F2' }]}>
          <Video size={16} color="#EF4444" />
          <Text style={[s.kpiVal, { color: '#EF4444' }]}>{liveCount}</Text>
          <Text style={s.kpiLbl}>Active Streams</Text>
        </View>
        <View style={[s.kpiCard, { backgroundColor: '#ECFDF5' }]}>
          <Server size={16} color="#059669" />
          <Text style={[s.kpiVal, { color: '#059669' }]}>{recordedCount}</Text>
          <Text style={s.kpiLbl}>Recordings</Text>
        </View>
      </View>

      <FlatList
        data={classes}
        keyExtractor={c => c.id}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <PhoneCall size={44} color="#CBD5E1" />
            <Text style={s.emptyTitle}>No live sessions scheduled</Text>
            <Text style={s.emptySub}>Tap + to launch or schedule a live class</Text>
          </View>
        }
        renderItem={({ item: cls }) => {
          const isLive = cls.status === 'live'
          const isCompleted = cls.status === 'completed'
          return (
            <View style={[s.card, isLive && s.cardLive]}>
              {isLive && <View style={s.liveStripe} />}
              <View style={s.cardTop}>
                <View style={[s.iconBox, isLive && s.iconBoxLive]}>
                  <PhoneCall size={20} color={isLive ? '#EF4444' : '#64748B'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle} numberOfLines={2}>
                    {cls.title}
                  </Text>
                  <View style={s.metaRow}>
                    <Calendar size={11} color="#94A3B8" />
                    <Text style={s.metaText}>{new Date(cls.scheduled_at).toLocaleDateString()}</Text>
                    <Clock size={11} color="#94A3B8" />
                    <Text style={s.metaText}>{cls.duration_minutes}m</Text>
                  </View>
                </View>
                <View style={[s.statusBadge, isLive ? s.statusLive : isCompleted ? s.statusCompleted : s.statusScheduled]}>
                  {isLive && <View style={s.statusDot} />}
                  <Text
                    style={[
                      s.statusText,
                      { color: isLive ? '#EF4444' : isCompleted ? '#059669' : '#64748B' },
                    ]}
                  >
                    {cls.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Action row */}
              <View style={s.cardActions}>
                {isLive ? (
                  <TouchableOpacity style={s.joinBtn} onPress={() => WebBrowser.openBrowserAsync(cls.join_url)}>
                    <ExternalLink size={14} color="#FFFFFF" />
                    <Text style={s.joinBtnText}>JOIN SESSION NOW</Text>
                  </TouchableOpacity>
                ) : isCompleted && cls.auto_record ? (
                  <TouchableOpacity style={s.recordBtn} onPress={() => WebBrowser.openBrowserAsync(cls.join_url)}>
                    <DownloadCloud size={14} color="#004B93" />
                    <Text style={s.recordBtnText}>Download Recording</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={s.launchBtn} onPress={() => handleLaunch(cls)}>
                    <Video size={14} color="#FFFFFF" />
                    <Text style={s.launchBtnText}>Launch Session</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        }}
      />

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setShowModal(true)} activeOpacity={0.85}>
        <Plus size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Schedule Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Schedule Live Session</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} style={s.modalCloseBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <View style={s.formField}>
              <Text style={s.formLabel}>Session Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Physics Thermodynamics Class 6"
                placeholderTextColor="#94A3B8"
                style={s.formInput}
              />
            </View>

            <View style={s.formField}>
              <Text style={s.formLabel}>Duration (Minutes)</Text>
              <TextInput
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                style={s.formInput}
              />
            </View>

            <View style={s.toggleRow}>
              <View>
                <Text style={s.formLabel}>Automated Cloud Recording</Text>
                <Text style={s.toggleSub}>Record MP4 session directly to server</Text>
              </View>
              <Switch
                value={autoRecord}
                onValueChange={setAutoRecord}
                trackColor={{ false: '#E2E8F0', true: '#FECACA' }}
                thumbColor={autoRecord ? '#EF4444' : '#CBD5E1'}
              />
            </View>

            <TouchableOpacity style={s.scheduleBtn} onPress={handleSchedule} disabled={saving} activeOpacity={0.85}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <CheckCircle size={18} color="#FFFFFF" />
                  <Text style={s.scheduleBtnText}>Authorize & Launch</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF2F2' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600' },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF2F8' },
  subTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', flex: 1 },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: '#FECACA' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  liveChipText: { fontSize: 10, fontWeight: '900', color: '#EF4444' },
  kpiRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  kpiCard: { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 4 },
  kpiVal: { fontSize: 20, fontWeight: '900' },
  kpiLbl: { fontSize: 9, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  listContent: { padding: 16, paddingBottom: 96 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EEF2F8', shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
  cardLive: { borderColor: '#FECACA' },
  liveStripe: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: '#EF4444' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  iconBoxLive: { backgroundColor: '#FEF2F2' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusLive: { backgroundColor: '#FEF2F2' },
  statusCompleted: { backgroundColor: '#ECFDF5' },
  statusScheduled: { backgroundColor: '#F1F5F9' },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#EF4444' },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  cardActions: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#EF4444', paddingVertical: 10, borderRadius: 12 },
  joinBtnText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
  recordBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#EBF3FC', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  recordBtnText: { fontSize: 12, fontWeight: '800', color: '#004B93' },
  launchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0F172A', paddingVertical: 10, borderRadius: 12 },
  launchBtnText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#64748B', marginTop: 16 },
  emptySub: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 4 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', shadowColor: '#EF4444', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEF2F8' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  formField: { marginBottom: 16 },
  formLabel: { fontSize: 12, fontWeight: '800', color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  formInput: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, fontSize: 14, fontWeight: '600', color: '#0F172A', backgroundColor: '#F8FAFC' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: 14, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  toggleSub: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  scheduleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#EF4444', borderRadius: 16, paddingVertical: 16, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  scheduleBtnText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
})
