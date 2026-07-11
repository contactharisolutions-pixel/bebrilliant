import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Check, ArrowLeft, ArrowRight, Clock, Award, HelpCircle } from 'lucide-react-native'
import { apiFetch } from '../../../../lib/api'

interface Question {
  id: string
  text: string
  options?: string[]
  answer: string
}

interface ExamDetail {
  id: string
  name: string
  duration: number
  marks: number
  questions: Question[]
}

export default function ExamAttemptPlayer() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // Player States
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)

  // Result States
  const [showResult, setShowResult] = useState(false)
  const [resultData, setResultData] = useState<any>(null)

  const timerRef = useRef<any>(null)

  const fetchDetails = async () => {
    try {
      const data = await apiFetch(`/api/dashboard/exams/detail?id=${id}`)
      setExam(data)
      setTimeLeft((data?.duration || 60) * 60) // Convert mins to secs
    } catch (e) {
      console.error(e)
      Alert.alert('Error', 'Failed to retrieve exam details')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetails()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [id])

  useEffect(() => {
    if (loading || !exam) return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [loading, exam])

  const handleSelectOption = (qId: string, optionIndex: number) => {
    const letters = ['A', 'B', 'C', 'D']
    const choice = letters[optionIndex]
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: choice
    }))
  }

  const handleAutoSubmit = () => {
    Alert.alert('Time Up', 'Your exam period has expired. Submitting your answers automatically.', [
      { text: 'OK', onPress: () => performSubmit() }
    ])
  }

  const performSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setSubmitting(true)
    try {
      const result = await apiFetch('/api/student/exam/submit', {
        method: 'POST',
        body: JSON.stringify({
          exam_id: id,
          answers: selectedAnswers
        })
      })

      if (result && result.success) {
        setResultData(result)
        setShowResult(true)
      } else {
        throw new Error(result.error || 'Failed to submit answers')
      }
    } catch (e: any) {
      console.error(e)
      Alert.alert('Submission Error', e.message || 'We could not submit your attempt.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center">
        <ActivityIndicator size="large" color="#004B93" />
      </View>
    )
  }

  if (!exam || !exam.questions || exam.questions.length === 0) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center p-6">
        <Text className="text-base text-red-600 font-bold">Exam contains no questions</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-primary px-6 py-2.5 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const currentQuestion = exam.questions[currentIdx]
  const currentAnswer = selectedAnswers[currentQuestion.id]

  return (
    <View className="flex-1 bg-bg-card2">
      {/* Header bar with timer */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-border">
        <Text className="text-base font-black text-text-primary flex-1 mr-3" numberOfLines={1}>
          {exam.name}
        </Text>
        <View className="flex-row items-center bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
          <Clock size={14} color="#EF4444" />
          <Text className="text-xs font-black text-rose-700 ml-1.5">{formatTime(timeLeft)}</Text>
        </View>
      </View>

      {/* Progress Line */}
      <View className="h-1 bg-border w-full flex-row">
        <View
          style={{ width: `${((currentIdx + 1) / exam.questions.length) * 100}%` }}
          className="h-full bg-primary"
        />
      </View>

      {/* Question Canvas */}
      <ScrollView className="flex-1 p-5">
        <View className="rounded-3xl bg-white border border-border p-6 shadow-sm mb-6">
          <Text className="text-xs font-bold text-primary uppercase">
            Question {currentIdx + 1} of {exam.questions.length}
          </Text>
          <Text className="text-base font-bold text-text-primary mt-3">
            {currentQuestion.text}
          </Text>
        </View>

        {/* Options */}
        <View className="space-y-4">
          {currentQuestion.options?.map((opt, idx) => {
            const letter = ['A', 'B', 'C', 'D'][idx]
            const isSelected = currentAnswer === letter

            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSelectOption(currentQuestion.id, idx)}
                className={`flex-row items-center rounded-2xl border p-4 shadow-sm active:opacity-95 mb-4 ${
                  isSelected ? 'bg-primary/5 border-primary' : 'bg-white border-border'
                }`}
              >
                <View className={`h-6 w-6 rounded-full border items-center justify-center mr-4 ${
                  isSelected ? 'bg-primary border-primary' : 'border-border bg-bg-card2'
                }`}>
                  {isSelected ? (
                    <Check size={14} color="#FFF" />
                  ) : (
                    <Text className="text-xs font-bold text-text-muted">{letter}</Text>
                  )}
                </View>
                <Text className="text-sm font-semibold text-text-primary flex-1">{opt}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      {/* Controller Buttons Footer */}
      <View className="flex-row justify-between bg-white border-t border-border px-5 py-4">
        {/* Prev */}
        <TouchableOpacity
          onPress={() => setCurrentIdx((p) => Math.max(0, p - 1))}
          disabled={currentIdx === 0}
          className={`flex-row items-center justify-center px-5 py-3 rounded-xl border ${
            currentIdx === 0 ? 'border-border opacity-40' : 'border-border bg-white'
          }`}
        >
          <ArrowLeft size={16} color="#4B5563" />
          <Text className="text-text-primary font-bold text-xs ml-2">Previous</Text>
        </TouchableOpacity>

        {/* Next / Submit */}
        {currentIdx < exam.questions.length - 1 ? (
          <TouchableOpacity
            onPress={() => setCurrentIdx((p) => p + 1)}
            className="flex-row items-center justify-center bg-primary px-5 py-3 rounded-xl shadow-sm"
          >
            <Text className="text-white font-bold text-xs mr-2">Next Question</Text>
            <ArrowRight size={16} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Submit Exam', 'Are you sure you want to finalize your attempt?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Submit', onPress: performSubmit }
              ])
            }}
            disabled={submitting}
            className="flex-row items-center justify-center bg-emerald-600 px-6 py-3 rounded-xl shadow-sm"
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text className="text-white font-bold text-xs">Finish & Submit</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Results Overlay Sheet */}
      <Modal animationType="slide" transparent={true} visible={showResult}>
        <View className="flex-1 bg-black/60 items-center justify-center p-6">
          <View className="w-full bg-white rounded-3xl p-6 shadow-2xl items-center space-y-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
              <Award size={32} color="#10B981" />
            </View>

            <View className="items-center">
              <Text className="text-xl font-black text-text-primary">Exam Completed</Text>
              <Text className="text-sm text-text-secondary mt-1 text-center">
                Your answers have been graded. Here is your scorecard:
              </Text>
            </View>

            {/* Scorecard block */}
            <View className="w-full bg-bg-card2 rounded-2xl p-5 border border-border items-center space-y-4">
              <View className="items-center">
                <Text className="text-[10px] font-bold text-text-secondary uppercase">Score Gained</Text>
                <Text className="text-3xl font-black text-primary mt-1">
                  {resultData?.score} / {resultData?.total_marks}
                </Text>
              </View>
              <View className="flex-row justify-between w-full border-t border-border pt-4">
                <View className="items-center flex-1">
                  <Text className="text-[9px] font-bold text-text-secondary uppercase">Accuracy</Text>
                  <Text className="text-sm font-bold text-emerald-600 mt-1">
                    {resultData?.percentage}%
                  </Text>
                </View>
                <View className="items-center flex-1 border-l border-border">
                  <Text className="text-[9px] font-bold text-text-secondary uppercase">Correct Ans</Text>
                  <Text className="text-sm font-bold text-text-primary mt-1">
                    {resultData?.correct} Qs
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                setShowResult(false)
                router.replace('/(student)/exams')
              }}
              className="w-full bg-primary py-4 rounded-xl items-center shadow-lg active:opacity-95"
            >
              <Text className="text-white font-bold text-base">Back to Exam Center</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}
