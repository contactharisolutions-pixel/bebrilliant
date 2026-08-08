import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet, Switch,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Award, Clock, HelpCircle, Users, TrendingUp, CheckCircle, XCircle, Shield } from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'

interface ExamDetail {
  id: string; name: string; is_active: boolean; duration?: number;
  is_paid: boolean; price: number; created_at: string;
  exam_config?: { total_questions: number }
}
interface AttemptRow {
  id: string; student_name: string; score: number; max: number; submitted_at: string; passed: boolean
}

export default function ExamDetail() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [exam, setExam]           = useState<ExamDetail | null>(null)
  const [attempts, setAttempts]   = useState<AttemptRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [toggling, setToggling]   = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      apiFetch(`/api/dashboard/exams/online?id=${id}`),
      apiFetch(`/api/dashboard/exams/results?exam_id=${id}`),
    ]).then(([exData, resData]) => {
      setExam(exData?.exam || null)
      setAttempts(resData?.attempts || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const handleToggle = async () => {
    if (!exam) return
    setToggling(true)
    try {
      await apiFetch('/api/dashboard/exams/online', {
        method: 'POST',
        body: JSON.stringify({ action: 'TOGGLE_STATUS', payload: { id: exam.id, is_active: !exam.is_active } }),
      })
      setExam(prev => prev ? { ...prev, is_active: !prev.is_active } : null)
    } catch { Alert.alert('Error', 'Could not update status') }
    finally { setToggling(false) }
  }

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + (a.max > 0 ? (a.score / a.max) * 100 : 0), 0) / attempts.length)
    : 0
  const passRate = attempts.length > 0
    ? Math.round((attempts.filter(a => a.passed).length / attempts.length) * 100)
    : 0

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    )
  }
  if (!exam) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#64748B', textAlign: 'center' }}>Exam not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#7C3AED', fontWeight: '700' }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F3FF' }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{exam.name}</Text>
        <View style={[s.headerBadge, exam.is_active ? s.badgeLive : s.badgeDraft]}>
          {exam.is_active && <View style={s.badgeDot} />}
          <Text style={[s.badgeText, { color: exam.is_active ? '#EF4444' : '#94A3B8' }]}>
            {exam.is_active ? 'LIVE' : 'DRAFT'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        {/* KPI Row */}
        <View style={s.kpiRow}>
          {[
            { icon: Users, label: 'Attempts', value: attempts.length, color: '#7C3AED', bg: '#F5F3FF' },
            { icon: TrendingUp, label: 'Avg Score', value: `${avgScore}%`, color: '#059669', bg: '#ECFDF5' },
            { icon: Shield, label: 'Pass Rate', value: `${passRate}%`, color: '#004B93', bg: '#EBF3FC' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <View key={label} style={[s.kpiCard, { backgroundColor: bg }]}>
              <Icon size={16} color={color} />
              <Text style={[s.kpiVal, { color }]}>{value}</Text>
              <Text style={s.kpiLbl}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Config card */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>EXAM CONFIGURATION</Text>
          {[
            { icon: Clock, label: 'Duration', value: `${exam.duration ?? 60} minutes` },
            { icon: HelpCircle, label: 'Questions', value: `${exam.exam_config?.total_questions ?? 0}` },
            { icon: Award, label: 'Pricing', value: exam.is_paid ? `₹${exam.price}` : 'Free' },
          ].map(({ icon: Icon, label, value }) => (
            <View key={label} style={s.configRow}>
              <View style={s.configIcon}><Icon size={15} color="#7C3AED" /></View>
              <Text style={s.configLabel}>{label}</Text>
              <Text style={s.configValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Toggle Status */}
        <View style={[s.card, { marginTop: 12 }]}>
          <View style={s.toggleRow}>
            <View>
              <Text style={s.toggleTitle}>Exam Status</Text>
              <Text style={s.toggleSub}>{exam.is_active ? 'Students can attempt this exam' : 'Exam is in draft mode'}</Text>
            </View>
            {toggling
              ? <ActivityIndicator size="small" color="#7C3AED" />
              : <Switch value={exam.is_active} onValueChange={handleToggle} trackColor={{ false: '#E2E8F0', true: '#FECACA' }} thumbColor={exam.is_active ? '#EF4444' : '#CBD5E1'} />
            }
          </View>
        </View>

        {/* Attempts list */}
        <View style={[s.card, { marginTop: 12 }]}>
          <Text style={s.sectionTitle}>STUDENT ATTEMPTS ({attempts.length})</Text>
          {attempts.length === 0
            ? <Text style={s.emptyText}>No attempts yet. Activate the exam to allow students to attempt.</Text>
            : attempts.map((a, i) => {
              const pct = a.max > 0 ? Math.round((a.score / a.max) * 100) : 0
              const scoreColor = pct >= 70 ? '#059669' : pct >= 50 ? '#F59E0B' : '#EF4444'
              return (
                <View key={a.id} style={[s.attemptRow, i < attempts.length - 1 && s.attemptBorder]}>
                  <View style={s.attemptLeft}>
                    {a.passed
                      ? <CheckCircle size={16} color="#059669" />
                      : <XCircle size={16} color="#EF4444" />}
                    <View>
                      <Text style={s.attemptName}>{a.student_name}</Text>
                      <Text style={s.attemptDate}>{new Date(a.submitted_at).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <Text style={[s.attemptScore, { color: scoreColor }]}>{a.score}/{a.max} ({pct}%)</Text>
                </View>
              )
            })
          }
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF2F8', paddingTop: 52 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '900', color: '#0F172A' },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  badgeLive: { backgroundColor: '#FEF2F2' },
  badgeDraft: { backgroundColor: '#F1F5F9' },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  badgeText: { fontSize: 10, fontWeight: '900' },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  kpiCard: { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 4 },
  kpiVal: { fontSize: 20, fontWeight: '900' },
  kpiLbl: { fontSize: 9, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4, color: '#64748B', textTransform: 'uppercase', marginBottom: 14 },
  configRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  configIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
  configLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#64748B' },
  configValue: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  toggleSub: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  emptyText: { fontSize: 13, color: '#94A3B8', fontWeight: '500', fontStyle: 'italic' },
  attemptRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  attemptBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  attemptLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  attemptName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  attemptDate: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  attemptScore: { fontSize: 13, fontWeight: '900' },
})
