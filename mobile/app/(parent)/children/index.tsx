import React, { useState, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { Check, X, Clock, HelpCircle, Calendar, Award, BookOpen, ChevronRight } from 'lucide-react-native'
import { useParentChildren } from '../../../hooks/useParentChildren'
import { useParentChildSummary } from '../../../hooks/useParentChildSummary'
import { ParentHeader } from '../../../components/parent/ParentHeader'

export default function ParentChildrenScreen() {
  const { data: children, isLoading: childrenLoading } = useParentChildren()
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)

  useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id)
    }
  }, [children])

  const { data: summary, isLoading: summaryLoading } = useParentChildSummary(selectedChildId)
  const activeChild = children?.find(c => c.id === selectedChildId)
  const activeChildName = activeChild ? `${activeChild.first_name} ${activeChild.last_name || ''}` : 'Child'

  const mockSubjectMastery = [
    { subject: 'Mathematics', score: 92, target: 90 },
    { subject: 'Physics', score: 85, target: 85 },
    { subject: 'Chemistry', score: 78, target: 80 },
    { subject: 'Biology', score: 88, target: 85 },
    { subject: 'English', score: 90, target: 88 },
  ]

  if (childrenLoading) {
    return (
      <View style={s.container}>
        <ParentHeader showSearch={false} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#004B93" />
          <Text style={s.loadingText}>Loading Children Profiles…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <ParentHeader activeChildName={activeChildName} />

      {/* Horizontal Linked Children Chips Bar */}
      <View style={s.chipsBar}>
        <Text style={s.chipsTitle}>LINKED STUDENTS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {children?.map(child => {
            const isSelected = child.id === selectedChildId
            return (
              <TouchableOpacity
                key={child.id}
                onPress={() => setSelectedChildId(child.id)}
                style={[s.childChip, isSelected && s.childChipActive]}
              >
                <Text style={[s.childChipText, isSelected && { color: '#FFFFFF' }]}>
                  {child.first_name} {child.last_name || ''}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {summaryLoading && selectedChildId ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#004B93" />
          <Text style={s.loadingText}>Fetching Child Academic Summary…</Text>
        </View>
      ) : (
        summary && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
            {/* Academic Summary Card */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Academic Overview</Text>
              <View style={s.summaryGrid}>
                <View style={s.summaryItem}>
                  <Text style={s.summaryLabel}>Attendance</Text>
                  <Text style={[s.summaryVal, { color: '#059669' }]}>{summary.attendanceRate}%</Text>
                </View>
                <View style={s.summaryDivider} />
                <View style={s.summaryItem}>
                  <Text style={s.summaryLabel}>Average Score</Text>
                  <Text style={[s.summaryVal, { color: '#004B93' }]}>{summary.avgScore}%</Text>
                </View>
                <View style={s.summaryDivider} />
                <View style={s.summaryItem}>
                  <Text style={s.summaryLabel}>Exams Done</Text>
                  <Text style={[s.summaryVal, { color: '#7C3AED' }]}>{summary.completedExams}</Text>
                </View>
              </View>
            </View>

            {/* Subject Mastery Progress Bars */}
            <View style={[s.card, { marginTop: 12 }]}>
              <Text style={s.sectionTitle}>SUBJECT MASTERY BREAKDOWN</Text>
              {mockSubjectMastery.map(subj => (
                <View key={subj.subject} style={s.subjectRow}>
                  <View style={s.subjectHeader}>
                    <Text style={s.subjectName}>{subj.subject}</Text>
                    <Text style={s.subjectScore}>{subj.score}%</Text>
                  </View>
                  <View style={s.progressTrack}>
                    <View
                      style={[
                        s.progressFill,
                        {
                          width: `${subj.score}%`,
                          backgroundColor: subj.score >= 80 ? '#059669' : '#004B93',
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Attendance Log Tracker */}
            <View style={[s.card, { marginTop: 12 }]}>
              <View style={s.rowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Calendar size={16} color="#004B93" />
                  <Text style={s.cardTitle}>Attendance Log (30 Days)</Text>
                </View>
              </View>

              {summary.attendanceLogs.length > 0 ? (
                summary.attendanceLogs.slice(0, 10).map((log, idx) => (
                  <View
                    key={idx}
                    style={[s.logRow, idx < summary.attendanceLogs.length - 1 && s.logBorder]}
                  >
                    <Text style={s.logDate}>
                      {new Date(log.date).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })}
                    </Text>
                    <View>
                      {log.status === 'present' && (
                        <View style={[s.statusPill, s.statusPresent]}>
                          <Check size={10} color="#059669" />
                          <Text style={[s.statusPillText, { color: '#059669' }]}>PRESENT</Text>
                        </View>
                      )}
                      {log.status === 'absent' && (
                        <View style={[s.statusPill, s.statusAbsent]}>
                          <X size={10} color="#EF4444" />
                          <Text style={[s.statusPillText, { color: '#EF4444' }]}>ABSENT</Text>
                        </View>
                      )}
                      {log.status === 'late' && (
                        <View style={[s.statusPill, s.statusLate]}>
                          <Clock size={10} color="#D97706" />
                          <Text style={[s.statusPillText, { color: '#D97706' }]}>LATE</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Calendar size={28} color="#9CA3AF" />
                  <Text style={{ marginTop: 6, fontSize: 12, color: '#64748B' }}>No attendance logs recorded</Text>
                </View>
              )}
            </View>

            {/* Historical Score Ledger */}
            <View style={[s.card, { marginTop: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Award size={16} color="#7C3AED" />
                <Text style={s.cardTitle}>Historical Grade Ledger</Text>
              </View>

              {summary.recentScores.length > 0 ? (
                summary.recentScores.map((score, idx) => (
                  <View
                    key={score.id || idx}
                    style={[s.ledgerRow, idx < summary.recentScores.length - 1 && s.ledgerBorder]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.ledgerName} numberOfLines={1}>{score.exam_name}</Text>
                      <Text style={s.ledgerSub}>{score.subject} · {new Date(score.exam_date).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.ledgerScore}>{score.marks_obtained}/{score.total_marks}</Text>
                      <Text style={s.ledgerPct}>{score.percentage}%</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <HelpCircle size={28} color="#9CA3AF" />
                  <Text style={{ marginTop: 6, fontSize: 12, color: '#64748B' }}>No grade reports available</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EBF3FC' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600' },
  chipsBar: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEF2F8' },
  chipsTitle: { fontSize: 9, fontWeight: '900', color: '#64748B', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  childChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#EEF2F8' },
  childChipActive: { backgroundColor: '#004B93', borderColor: '#004B93' },
  childChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, shadowColor: '#004B93', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
  summaryGrid: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 9, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryVal: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  summaryDivider: { width: 1, height: 28, backgroundColor: '#F1F5F9' },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4, color: '#64748B', textTransform: 'uppercase', marginBottom: 12 },
  subjectRow: { marginBottom: 10 },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  subjectName: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  subjectScore: { fontSize: 12, fontWeight: '900', color: '#004B93' },
  progressTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 99 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  logRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  logBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  logDate: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPresent: { backgroundColor: '#ECFDF5' },
  statusAbsent: { backgroundColor: '#FEF2F2' },
  statusLate: { backgroundColor: '#FFFBEB' },
  statusPillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  ledgerBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  ledgerName: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  ledgerSub: { fontSize: 10, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  ledgerScore: { fontSize: 13, fontWeight: '900', color: '#7C3AED' },
  ledgerPct: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 2 },
})
