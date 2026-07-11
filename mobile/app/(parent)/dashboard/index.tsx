import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, FlatList } from 'react-native'
import { useIdentity } from '../../../contexts/IdentityContext'
import { Award, Users, CreditCard, ChevronRight, X, Check, Calendar, HelpCircle } from 'lucide-react-native'
import { useParentChildren } from '../../../hooks/useParentChildren'
import { useParentChildSummary } from '../../../hooks/useParentChildSummary'

export default function ParentDashboard() {
  const { user } = useIdentity()
  const { data: children, isLoading: childrenLoading } = useParentChildren()
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [selectorVisible, setSelectorVisible] = useState(false)

  // Default to the first child once children list loaded
  useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id)
    }
  }, [children])

  const { data: summary, isLoading: summaryLoading } = useParentChildSummary(selectedChildId)

  const activeChild = children?.find(c => c.id === selectedChildId)

  if (childrenLoading) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center">
        <ActivityIndicator size="large" color="#004B93" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-bg-card2">
      <ScrollView className="flex-1 px-5 py-6">
        {/* Welcome Card */}
        <View className="rounded-3xl bg-primary p-6 shadow-lg shadow-primary/20">
          <Text className="text-xs font-bold uppercase tracking-wider text-white/70">
            Parent Dashboard
          </Text>
          <Text className="mt-1 text-2xl font-black text-white">
            {user?.fullName || 'Parent'}
          </Text>
          <Text className="mt-2 text-sm text-white/80">
            Institution: {user?.tenant?.name || 'BrightBoard Institution'}
          </Text>
        </View>

        {/* Child Selector Dropdown Trigger */}
        {children && children.length > 0 ? (
          <TouchableOpacity
            onPress={() => setSelectorVisible(true)}
            className="mt-6 rounded-2xl bg-white border border-border p-5 shadow-sm flex-row justify-between items-center active:opacity-95"
          >
            <View>
              <Text className="text-xs font-bold uppercase text-text-secondary tracking-wide">
                Linked Student (Tap to switch)
              </Text>
              <Text className="text-lg font-black text-text-primary mt-1">
                {activeChild ? `${activeChild.first_name} ${activeChild.last_name || ''}` : 'Select Child'}
              </Text>
              <Text className="text-xs text-text-muted mt-0.5">
                Class {(activeChild?.metadata as any)?.school_class || 'N/A'} · Section {(activeChild?.metadata as any)?.division || 'N/A'}
              </Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <Users size={20} color="#004B93" />
            </View>
          </TouchableOpacity>
        ) : (
          <View className="mt-6 rounded-2xl bg-white border border-border p-5 shadow-sm items-center justify-center">
            <Users size={24} color="#9CA3AF" />
            <Text className="text-xs text-text-secondary mt-2">No linked children found</Text>
          </View>
        )}

        {summaryLoading && selectedChildId ? (
          <View className="py-12">
            <ActivityIndicator size="large" color="#004B93" />
          </View>
        ) : (
          summary && (
            <View className="mt-6 space-y-6 pb-12">
              {/* KPI Cards Grid */}
              <View className="flex-row flex-wrap justify-between">
                {/* Attendance Rate */}
                <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm mb-4">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 mb-3">
                    <Calendar size={18} color="#10B981" />
                  </View>
                  <Text className="text-2xl font-black text-text-primary">
                    {summary.attendanceRate}%
                  </Text>
                  <Text className="text-[11px] font-bold text-text-secondary mt-1">Attendance Rate</Text>
                </View>

                {/* Avg Score */}
                <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm mb-4">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10 mb-3">
                    <Award size={18} color="#004B93" />
                  </View>
                  <Text className="text-2xl font-black text-text-primary">
                    {summary.avgScore}%
                  </Text>
                  <Text className="text-[11px] font-bold text-text-secondary mt-1">Average Grade</Text>
                </View>

                {/* Total Exams Done */}
                <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm mb-4">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-violet-100 mb-3">
                    <Award size={18} color="#7C3AED" />
                  </View>
                  <Text className="text-2xl font-black text-text-primary">
                    {summary.completedExams}
                  </Text>
                  <Text className="text-[11px] font-bold text-text-secondary mt-1">Exams Completed</Text>
                </View>

                {/* Absent Count */}
                <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm mb-4">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-rose-100 mb-3">
                    <X size={18} color="#EF4444" />
                  </View>
                  <Text className="text-2xl font-black text-rose-600">
                    {summary.absentCount}
                  </Text>
                  <Text className="text-[11px] font-bold text-text-secondary mt-1">Days Absent</Text>
                </View>
              </View>

              {/* Recent Test Performance list */}
              <Text className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Recent Scores
              </Text>
              <View className="rounded-3xl bg-white border border-border p-5 shadow-sm">
                {summary.recentScores.length > 0 ? (
                  summary.recentScores.map((score) => (
                    <View key={score.id} className="flex-row justify-between items-center py-2.5 border-b border-border last:border-b-0">
                      <View className="flex-1 pr-4">
                        <Text className="text-xs font-bold text-text-primary" numberOfLines={1}>
                          {score.exam_name}
                        </Text>
                        <Text className="text-[10px] text-text-muted mt-0.5">
                          Subject: {score.subject} · {new Date(score.exam_date).toLocaleDateString()}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs font-black text-emerald-600">
                          {score.marks_obtained}/{score.total_marks}
                        </Text>
                        <Text className="text-[9px] text-text-muted">
                          {score.percentage}% accuracy
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View className="items-center justify-center py-6">
                    <HelpCircle size={24} color="#9CA3AF" />
                    <Text className="text-xs text-text-secondary mt-2">No exam results recorded</Text>
                  </View>
                )}
              </View>
            </View>
          )
        )}
      </ScrollView>

      {/* Child Selector Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectorVisible}
        onRequestClose={() => setSelectorVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6 space-y-5">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-black text-text-primary">Select Student</Text>
              <TouchableOpacity onPress={() => setSelectorVisible(false)} className="p-1">
                <X size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={children}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedChildId
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedChildId(item.id)
                      setSelectorVisible(false)
                    }}
                    className={`flex-row items-center justify-between py-4 border-b border-border ${
                      isSelected ? 'bg-primary/5 px-3 rounded-xl border-b-transparent' : ''
                    }`}
                  >
                    <View>
                      <Text className={`text-base font-bold ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                        {item.first_name} {item.last_name || ''}
                      </Text>
                      <Text className="text-xs text-text-muted mt-0.5">{item.email}</Text>
                    </View>
                    {isSelected && <Check size={18} color="#004B93" />}
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
