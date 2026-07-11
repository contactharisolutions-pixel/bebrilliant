import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { Check, X, Clock, HelpCircle, Calendar, Award } from 'lucide-react-native'
import { useParentChildren } from '../../../hooks/useParentChildren'
import { useParentChildSummary } from '../../../hooks/useParentChildSummary'

export default function ParentChildren() {
  const { data: children, isLoading: childrenLoading } = useParentChildren()
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)

  // Auto-select first child
  React.useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id)
    }
  }, [children])

  const { data: summary, isLoading: summaryLoading } = useParentChildSummary(selectedChildId)

  if (childrenLoading) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center">
        <ActivityIndicator size="large" color="#004B93" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-bg-card2">
      {/* Horizontal Children selector */}
      <View className="bg-white border-b border-border py-4 px-5">
        <Text className="text-xs font-bold text-text-secondary uppercase mb-3">Linked Students</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {children?.map((child) => {
            const isSelected = child.id === selectedChildId
            return (
              <TouchableOpacity
                key={child.id}
                onPress={() => setSelectedChildId(child.id)}
                className={`px-5 py-2.5 rounded-full mr-3 border ${
                  isSelected ? 'bg-primary border-primary' : 'bg-bg-card2 border-border'
                }`}
              >
                <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-text-primary'}`}>
                  {child.first_name} {child.last_name || ''}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {summaryLoading && selectedChildId ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#004B93" />
        </View>
      ) : (
        summary && (
          <ScrollView className="flex-1 p-5 space-y-6">
            {/* Performance Stats */}
            <View className="rounded-3xl bg-white border border-border p-5 shadow-sm mb-6">
              <Text className="text-base font-black text-text-primary mb-4">Academic Summary</Text>
              <View className="flex-row justify-between mb-4">
                <View>
                  <Text className="text-xs font-semibold text-text-muted">Attendance Rate</Text>
                  <Text className="text-2xl font-black text-emerald-600 mt-1">{summary.attendanceRate}%</Text>
                </View>
                <View className="border-l border-border pl-6">
                  <Text className="text-xs font-semibold text-text-muted">Average Score</Text>
                  <Text className="text-2xl font-black text-primary mt-1">{summary.avgScore}%</Text>
                </View>
                <View className="border-l border-border pl-6">
                  <Text className="text-xs font-semibold text-text-muted">Exams Done</Text>
                  <Text className="text-2xl font-black text-text-primary mt-1">{summary.completedExams}</Text>
                </View>
              </View>
            </View>

            {/* Attendance Log / Calendar Tracker */}
            <View className="rounded-3xl bg-white border border-border p-5 shadow-sm mb-6">
              <View className="flex-row items-center mb-4">
                <Calendar size={18} color="#004B93" />
                <Text className="text-base font-black text-text-primary ml-2">Recent Attendance Log</Text>
              </View>

              {summary.attendanceLogs.length > 0 ? (
                <View className="space-y-3">
                  {summary.attendanceLogs.map((log, idx) => (
                    <View key={idx} className="flex-row justify-between items-center py-2 border-b border-border last:border-b-0 mt-1">
                      <Text className="text-xs font-semibold text-text-primary">
                        {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </Text>

                      <View className="flex-row items-center">
                        {log.status === 'present' && (
                          <View className="flex-row items-center bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            <Check size={12} color="#10B981" />
                            <Text className="text-[10px] font-bold text-emerald-700 ml-1 uppercase">Present</Text>
                          </View>
                        )}
                        {log.status === 'absent' && (
                          <View className="flex-row items-center bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                            <X size={12} color="#EF4444" />
                            <Text className="text-[10px] font-bold text-red-700 ml-1 uppercase">Absent</Text>
                          </View>
                        )}
                        {log.status === 'late' && (
                          <View className="flex-row items-center bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                            <Clock size={12} color="#F59E0B" />
                            <Text className="text-[10px] font-bold text-amber-700 ml-1 uppercase">Late</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="items-center justify-center py-8">
                  <Calendar size={24} color="#9CA3AF" />
                  <Text className="text-xs text-text-secondary mt-2">No attendance logs logged</Text>
                </View>
              )}
            </View>

            {/* Historical Score Ledger */}
            <View className="rounded-3xl bg-white border border-border p-5 shadow-sm mb-12">
              <View className="flex-row items-center mb-4">
                <Award size={18} color="#004B93" />
                <Text className="text-base font-black text-text-primary ml-2">Historical Grades</Text>
              </View>

              {summary.recentScores.length > 0 ? (
                summary.recentScores.map((score) => (
                  <View key={score.id} className="flex-row justify-between items-center py-3 border-b border-border last:border-b-0">
                    <View className="flex-1 pr-4">
                      <Text className="text-xs font-bold text-text-primary" numberOfLines={1}>
                        {score.exam_name}
                      </Text>
                      <Text className="text-[10px] text-text-muted mt-0.5">
                        Subject: {score.subject} · {new Date(score.exam_date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs font-black text-primary">
                        {score.marks_obtained}/{score.total_marks}
                      </Text>
                      <Text className="text-[9px] text-text-muted">
                        {score.percentage}% grade
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className="items-center justify-center py-8">
                  <HelpCircle size={24} color="#9CA3AF" />
                  <Text className="text-xs text-text-secondary mt-2">No score reports available</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )
      )}
    </View>
  )
}
