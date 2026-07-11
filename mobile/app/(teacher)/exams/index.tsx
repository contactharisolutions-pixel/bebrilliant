import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native'
import { useRouter } from 'expo-router'
import { BookOpen, Plus, Sparkles, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react-native'
import { useExams } from '../../../hooks/useExams'
import { apiFetch } from '../../../lib/api'

export default function TeacherExams() {
  const router = useRouter()
  const { data, isLoading, refetch } = useExams()
  const [activeTab, setActiveTab] = useState<'active' | 'draft'>('active')
  const [toggling, setToggling] = useState<string | null>(null)

  const handleToggleStatus = async (examId: string, currentStatus: boolean) => {
    setToggling(examId)
    try {
      await apiFetch('/api/dashboard/exams', {
        method: 'POST',
        body: JSON.stringify({
          action: 'TOGGLE_STATUS',
          payload: { id: examId, is_active: !currentStatus }
        })
      })
      refetch()
    } catch (e: any) {
      Alert.alert('Error', 'Failed to update exam status')
    } finally {
      setToggling(null)
    }
  }

  const exams = data?.exams || []
  const activeExams = exams.filter(ex => ex.is_active)
  const draftExams = exams.filter(ex => !ex.is_active)

  const displayedExams = activeTab === 'active' ? activeExams : draftExams

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center">
        <ActivityIndicator size="large" color="#004B93" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-bg-card2">
      {/* Header with actions */}
      <View className="px-5 py-4 bg-white border-b border-border">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-base font-black text-text-primary">Exam Center</Text>
          <View className="flex-row space-x-2">
            {/* AI Generator Button */}
            <TouchableOpacity
              onPress={() => router.push('/(teacher)/exams/ai-generator')}
              className="flex-row items-center bg-violet-600 px-3 py-2 rounded-xl mr-2"
            >
              <Sparkles size={14} color="#FFF" />
              <Text className="text-white font-bold text-xs ml-1">AI Gen</Text>
            </TouchableOpacity>

            {/* Standard Create */}
            <TouchableOpacity
              onPress={() => router.push('/(teacher)/exams/create')}
              className="flex-row items-center bg-primary px-3 py-2 rounded-xl"
            >
              <Plus size={14} color="#FFF" />
              <Text className="text-white font-bold text-xs ml-1">Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Buttons */}
        <View className="flex-row bg-bg-card2 p-1 rounded-xl">
          <TouchableOpacity
            onPress={() => setActiveTab('active')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'active' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === 'active' ? 'text-primary' : 'text-text-secondary'}`}>
              Active ({activeExams.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('draft')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'draft' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === 'draft' ? 'text-primary' : 'text-text-secondary'}`}>
              Drafts ({draftExams.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={displayedExams}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <BookOpen size={48} color="#9CA3AF" />
            <Text className="text-base font-bold text-text-secondary mt-4">No exams in this category</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="rounded-2xl bg-white border border-border p-5 shadow-sm mb-4">
            <TouchableOpacity
              onPress={() => router.push(`/(teacher)/exams/${item.id}`)}
              className="flex-row justify-between items-start"
            >
              <View className="flex-1 pr-4">
                <Text className="text-base font-black text-text-primary mb-1">
                  {item.name}
                </Text>
                <Text className="text-xs text-text-secondary">
                  Duration: {item.duration} Mins · Marks: {item.total_marks} · {item.is_paid ? `Paid ($${item.price})` : 'Free'}
                </Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <View className="flex-row justify-between items-center border-t border-border mt-4 pt-4">
              <View className="flex-row items-center">
                {item.is_active ? (
                  <>
                    <CheckCircle2 size={14} color="#10B981" />
                    <Text className="text-[11px] text-emerald-600 font-bold ml-1">Live & Active</Text>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} color="#F59E0B" />
                    <Text className="text-[11px] text-amber-600 font-bold ml-1">Draft Mode</Text>
                  </>
                )}
              </View>

              <View className="flex-row items-center">
                <Text className="text-xs text-text-secondary mr-2">Status:</Text>
                {toggling === item.id ? (
                  <ActivityIndicator size="small" color="#004B93" />
                ) : (
                  <Switch
                    value={item.is_active}
                    onValueChange={() => handleToggleStatus(item.id, item.is_active)}
                    thumbColor={item.is_active ? '#004B93' : '#F4F3F0'}
                    trackColor={{ false: '#767577', true: '#E0E7FF' }}
                  />
                )}
              </View>
            </View>
          </View>
        )}
      />
    </View>
  )
}
