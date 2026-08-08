import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Mail, Phone, BookOpen, Award, CheckCircle, XCircle, Clock, Key } from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'

interface StudentDetail {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  class_name?: string
  status?: string
  created_at?: string
}

interface ExamResult {
  id: string
  exam_name: string
  score: number
  max_score: number
  submitted_at: string
  passed: boolean
}

export default function StudentDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [results, setResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      apiFetch(`/api/dashboard/students?id=${id}`),
      apiFetch(`/api/dashboard/students/results?student_id=${id}`),
    ])
      .then(([stData, resData]) => {
        const found = stData?.student || (Array.isArray(stData) ? stData.find((s: any) => s.id === id) : stData)
        setStudent(found || null)
        setResults(resData?.results || resData || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleResetPassword = async () => {
    Alert.alert('Reset Password', `Send password reset email to ${student?.email}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Reset',
        onPress: async () => {
          setResetting(true)
          try {
            await apiFetch('/api/dashboard/students', {
              method: 'POST',
              body: JSON.stringify({ action: 'RESET_PASSWORD', payload: { student_id: id } }),
            })
            Alert.alert('Success', 'Password reset email sent.')
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to send reset link.')
          } finally {
            setResetting(false)
          }
        },
      },
    ])
  }

  const avgScore =
    results.length > 0
      ? Math.round(
          results.reduce((s, r) => s + (r.max_score > 0 ? (r.score / r.max_score) * 100 : 0), 0) / results.length
        )
      : 0

  const passedCount = results.filter(r => r.passed).length

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    )
  }

  if (!student) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#64748B', textAlign: 'center' }}>Student profile not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#059669', fontWeight: '700' }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const initials = `${student.first_name.charAt(0)}${(student.last_name || '').charAt(0)}`.toUpperCase()

  return (
    <View style={{ flex: 1, backgroundColor: '#F0FDF4' }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Student Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.name}>{student.first_name} {student.last_name}</Text>
          <Text style={s.className}>{student.class_name || 'Standard 10'}</Text>

          <View style={s.contactRow}>
            <View style={s.contactItem}>
              <Mail size={14} color="#64748B" />
              <Text style={s.contactText}>{student.email}</Text>
            </View>
            {student.phone && (
              <View style={s.contactItem}>
                <Phone size={14} color="#64748B" />
                <Text style={s.contactText}>{student.phone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: '#ECFDF5' }]}>
            <Award size={18} color="#059669" />
            <Text style={[s.statVal, { color: '#059669' }]}>{avgScore}%</Text>
            <Text style={s.statLbl}>Avg Score</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: '#EBF3FC' }]}>
            <BookOpen size={18} color="#004B93" />
            <Text style={[s.statVal, { color: '#004B93' }]}>{results.length}</Text>
            <Text style={s.statLbl}>Exams Taken</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: '#FFFBEB' }]}>
            <CheckCircle size={18} color="#D97706" />
            <Text style={[s.statVal, { color: '#D97706' }]}>{passedCount}</Text>
            <Text style={s.statLbl}>Passed</Text>
          </View>
        </View>

        {/* Results List */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>EXAM PERFORMANCE ({results.length})</Text>
          {results.length === 0 ? (
            <Text style={s.emptyText}>No exam results available for this student.</Text>
          ) : (
            results.map((r, idx) => {
              const pct = r.max_score > 0 ? Math.round((r.score / r.max_score) * 100) : 0
              const color = pct >= 75 ? '#059669' : pct >= 50 ? '#F59E0B' : '#EF4444'
              return (
                <View key={r.id || idx} style={[s.resultRow, idx < results.length - 1 && s.resultBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.examName}>{r.exam_name}</Text>
                    <View style={s.dateRow}>
                      <Clock size={11} color="#94A3B8" />
                      <Text style={s.dateText}>{new Date(r.submitted_at).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[s.scoreText, { color }]}>{r.score}/{r.max_score}</Text>
                    <Text style={[s.pctBadge, { color }]}>{pct}%</Text>
                  </View>
                </View>
              )
            })
          )}
        </View>

        {/* Quick Actions */}
        <View style={[s.card, { marginTop: 12 }]}>
          <Text style={s.sectionTitle}>ACCOUNT ACTIONS</Text>
          <TouchableOpacity style={s.actionBtn} onPress={handleResetPassword} disabled={resetting}>
            <Key size={16} color="#059669" />
            <Text style={s.actionBtnText}>Reset Student Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF2F8', paddingTop: 52 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, alignItems: 'center', shadowColor: '#059669', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  name: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  className: { fontSize: 12, fontWeight: '700', color: '#059669', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
  contactRow: { marginTop: 14, gap: 6, width: '100%' },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  contactText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 18, fontWeight: '900' },
  statLbl: { fontSize: 9, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4, color: '#64748B', textTransform: 'uppercase', marginBottom: 14 },
  emptyText: { fontSize: 13, color: '#94A3B8', fontWeight: '500', fontStyle: 'italic' },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  resultBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  examName: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dateText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  scoreText: { fontSize: 14, fontWeight: '900' },
  pctBadge: { fontSize: 10, fontWeight: '800', marginTop: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ECFDF5', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#A7F3D0' },
  actionBtnText: { fontSize: 13, fontWeight: '800', color: '#059669' },
})
