import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native'
import { useRouter } from 'expo-router'
import { BookOpen, CheckCircle, Clock, ChevronRight, Play, Award, HelpCircle, X } from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'

interface AvailableExam {
  id: string
  name: string
  subject: string
  duration: number
}

interface PastResult {
  id: string
  exam_name: string
  score: number
  max: number
  date: string
}

export default function StudentExams() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'available' | 'results'>('available')
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState<AvailableExam[]>([])
  const [results, setResults] = useState<PastResult[]>([])

  // Modal State
  const [selectedExam, setSelectedExam] = useState<AvailableExam | null>(null)
  const [starting, setStarting] = useState(false)

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

  useEffect(() => {
    fetchData()
  }, [])

  const handleStartExam = async () => {
    if (!selectedExam) return

    setStarting(true)
    try {
      // 1. Initialize attempt on the backend
      const response = await apiFetch('/api/student/exam/start', {
        method: 'POST',
        body: JSON.stringify({ exam_id: selectedExam.id })
      })

      if (response && response.attempt) {
        setSelectedExam(null)
        // 2. Navigate to exam controller player
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

  if (loading) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center">
        <ActivityIndicator size="large" color="#004B93" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-bg-card2">
      {/* Tab bar */}
      <View className="px-5 py-4 bg-white border-b border-border">
        <View className="flex-row bg-bg-card2 p-1 rounded-xl">
          <TouchableOpacity
            onPress={() => setActiveTab('available')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'available' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === 'available' ? 'text-primary' : 'text-text-secondary'}`}>
              Available ({available.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('results')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'results' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === 'results' ? 'text-primary' : 'text-text-secondary'}`}>
              Completed ({results.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={(activeTab === 'available' ? available : results) as any[]}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <BookOpen size={48} color="#9CA3AF" />
            <Text className="text-base font-bold text-text-secondary mt-4">
              {activeTab === 'available' ? 'No exams available' : 'No past results found'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (activeTab === 'available') {
            const ex = item as AvailableExam
            return (
              <TouchableOpacity
                onPress={() => setSelectedExam(ex)}
                className="flex-row items-center justify-between rounded-2xl bg-white border border-border p-5 shadow-sm mb-4 active:opacity-90"
              >
                <View className="flex-1 pr-4">
                  <Text className="text-base font-black text-text-primary mb-1">
                    {ex.name}
                  </Text>
                  <View className="flex-row items-center mt-2.5 space-x-4">
                    <View className="flex-row items-center">
                      <HelpCircle size={13} color="#9CA3AF" />
                      <Text className="text-xs text-text-secondary ml-1">{ex.subject}</Text>
                    </View>
                    <View className="flex-row items-center ml-4">
                      <Clock size={13} color="#9CA3AF" />
                      <Text className="text-xs text-text-secondary ml-1">{ex.duration} mins</Text>
                    </View>
                  </View>
                </View>
                <Play size={18} color="#004B93" />
              </TouchableOpacity>
            )
          } else {
            const res = item as PastResult
            return (
              <View className="flex-row items-center justify-between rounded-2xl bg-white border border-border p-5 shadow-sm mb-4">
                <View className="flex-1 pr-4">
                  <Text className="text-base font-black text-text-primary mb-1">
                    {res.exam_name}
                  </Text>
                  <Text className="text-xs text-text-secondary mt-1">
                    Attempted: {res.date}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-base font-black text-emerald-600">
                    {res.score}/{res.max}
                  </Text>
                  <Text className="text-[10px] text-text-muted mt-0.5">
                    {Math.round((res.score / res.max) * 100)}% Grade
                  </Text>
                </View>
              </View>
            )
          }
        }}
      />

      {/* Instructions Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedExam}
        onRequestClose={() => setSelectedExam(null)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6 space-y-5">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-black text-text-primary">Exam Instructions</Text>
              <TouchableOpacity onPress={() => setSelectedExam(null)} className="p-1">
                <X size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <Text className="text-base font-black text-primary">{selectedExam?.name}</Text>

            <View className="space-y-3 bg-bg-card2 p-4 rounded-2xl border border-border">
              <Text className="text-xs font-semibold text-text-secondary">
                · Time limit is {selectedExam?.duration} minutes.
              </Text>
              <Text className="text-xs font-semibold text-text-secondary mt-1.5">
                · Do not exit the application or switch tabs during the attempt.
              </Text>
              <Text className="text-xs font-semibold text-text-secondary mt-1.5">
                · The exam will submit automatically when the timer reaches 0.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleStartExam}
              disabled={starting}
              className="mt-6 flex-row items-center justify-center rounded-xl bg-primary py-4 shadow-lg active:opacity-90"
            >
              {starting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-white font-bold text-base">Start Exam Attempt</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}
