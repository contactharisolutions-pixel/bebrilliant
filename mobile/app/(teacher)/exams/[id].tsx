import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, BookOpen, Clock, Users, Calendar, HelpCircle, CheckCircle } from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'

interface ExamDetail {
  id: string
  name: string
  is_active: boolean
  is_paid: boolean
  price: number
  duration: number
  marks: number
  questions?: Array<{
    text: string
    options?: string[]
    answer: string
    difficulty?: string
  }>
}

interface Submission {
  id: string
  status: 'in_progress' | 'submitted' | 'evaluated'
  total_score: number | null
  start_time: string
  end_time: string | null
  first_name: string
  last_name: string | null
  email: string
}

export default function ExamDetails() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions'>('overview')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [exData, subData] = await Promise.all([
        apiFetch(`/api/dashboard/exams/detail?id=${id}`),
        apiFetch(`/api/teacher/exam-submissions?examId=${id}`)
      ])
      setExam(exData)
      setSubmissions(subData || [])
    } catch (e: any) {
      console.error(e)
      Alert.alert('Error', 'Failed to load exam details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  if (loading) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center">
        <ActivityIndicator size="large" color="#004B93" />
      </View>
    )
  }

  if (!exam) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center p-6">
        <Text className="text-base text-red-600 font-bold">Exam not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-primary px-6 py-2.5 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-bg-card2">
      {/* Header bar */}
      <View className="flex-row items-center px-5 py-4 bg-white border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-3">
          <ArrowLeft size={20} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-black text-text-primary" numberOfLines={1}>
          {exam.name}
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-border p-1">
        <TouchableOpacity
          onPress={() => setActiveTab('overview')}
          className={`flex-1 py-3 items-center border-b-2 ${
            activeTab === 'overview' ? 'border-primary' : 'border-transparent'
          }`}
        >
          <Text className={`text-sm font-bold ${activeTab === 'overview' ? 'text-primary' : 'text-text-secondary'}`}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('submissions')}
          className={`flex-1 py-3 items-center border-b-2 ${
            activeTab === 'submissions' ? 'border-primary' : 'border-transparent'
          }`}
        >
          <Text className={`text-sm font-bold ${activeTab === 'submissions' ? 'text-primary' : 'text-text-secondary'}`}>
            Submissions ({submissions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' ? (
        <ScrollView className="flex-1 p-5">
          {/* Stats Cards */}
          <View className="flex-row justify-between mb-6">
            <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm">
              <Clock size={20} color="#004B93" />
              <Text className="text-xs font-semibold text-text-muted mt-2">Duration</Text>
              <Text className="text-lg font-black text-text-primary mt-0.5">{exam.duration} mins</Text>
            </View>
            <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm">
              <HelpCircle size={20} color="#004B93" />
              <Text className="text-xs font-semibold text-text-muted mt-2">Questions</Text>
              <Text className="text-lg font-black text-text-primary mt-0.5">
                {exam.questions?.length || 0} items
              </Text>
            </View>
          </View>

          {/* Question List */}
          <Text className="text-base font-black text-text-primary mb-3">Question Bank</Text>
          {exam.questions && exam.questions.length > 0 ? (
            exam.questions.map((q, idx) => (
              <View key={idx} className="rounded-2xl bg-white border border-border p-4 shadow-sm mb-4">
                <Text className="text-xs font-bold text-primary">Q{idx + 1} {q.difficulty ? `· ${q.difficulty}` : ''}</Text>
                <Text className="text-sm font-bold text-text-primary mt-1">{q.text}</Text>
                {q.options && q.options.length > 0 && (
                  <View className="mt-3 space-y-1">
                    {q.options.map((opt, oIdx) => (
                      <Text key={oIdx} className="text-xs text-text-secondary">
                        {String.fromCharCode(65 + oIdx)}. {opt}
                      </Text>
                    ))}
                  </View>
                )}
                <View className="flex-row items-center mt-3 pt-3 border-t border-dashed border-border">
                  <CheckCircle size={14} color="#10B981" />
                  <Text className="text-xs font-bold text-emerald-700 ml-1">Answer: {q.answer}</Text>
                </View>
              </View>
            ))
          ) : (
            <View className="rounded-2xl bg-white border border-border p-8 items-center justify-center">
              <HelpCircle size={32} color="#9CA3AF" />
              <Text className="text-xs text-text-secondary mt-2">No questions defined</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        /* Submissions Tab */
        <FlatList
          data={submissions}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Users size={48} color="#9CA3AF" />
              <Text className="text-base font-bold text-text-secondary mt-4">No student attempts recorded</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="rounded-2xl bg-white border border-border p-4 shadow-sm mb-4">
              <View className="flex-row justify-between items-center">
                <View className="flex-1 pr-4">
                  <Text className="text-base font-bold text-text-primary">
                    {item.first_name} {item.last_name || ''}
                  </Text>
                  <Text className="text-xs text-text-secondary mt-0.5">{item.email}</Text>
                </View>
                <View className="items-end">
                  {item.status === 'evaluated' ? (
                    <Text className="text-base font-black text-emerald-600">
                      {item.total_score} marks
                    </Text>
                  ) : (
                    <View className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                      <Text className="text-[10px] font-bold text-amber-700 uppercase">{item.status}</Text>
                    </View>
                  )}
                </View>
              </View>

              {item.end_time && (
                <View className="flex-row items-center mt-3 pt-3 border-t border-border">
                  <Calendar size={12} color="#9CA3AF" />
                  <Text className="text-xs text-text-secondary ml-1">
                    Submitted: {new Date(item.end_time).toLocaleDateString()} at {new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  )
}
