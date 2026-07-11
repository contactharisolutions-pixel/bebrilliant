import React, { useState } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { ArrowLeft, Sparkles, Plus, AlertTriangle, CheckCircle } from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'

interface GeneratedQuestion {
  id: string
  subject: string
  text: string
  difficulty: string
  type: string
  options?: string[]
  answer: string
}

export default function AIExamGenerator() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])

  // Form states
  const [title, setTitle] = useState('')
  const [syllabusName, setSyllabusName] = useState('CBSE Grade 10')
  const [subject, setSubject] = useState('Science')
  const [count, setCount] = useState('5')

  const handleGenerate = async () => {
    if (!title || !syllabusName || !subject || !count) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    setQuestions([])
    try {
      const response = await apiFetch('/api/dashboard/ai', {
        method: 'POST',
        body: JSON.stringify({
          action: 'GENERATE_QUESTIONS',
          payload: {
            total_nodes: Number(count),
            syllabus_name: syllabusName,
            subjects: [{ name: subject }],
            language: 'English'
          }
        })
      })

      if (response && response.success && response.questions) {
        setQuestions(response.questions)
      } else {
        throw new Error('No questions returned')
      }
    } catch (e: any) {
      console.error(e)
      Alert.alert('AI Generation Failed', 'The AI engine could not complete the request. Please check API credentials / model settings.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeployExam = async () => {
    if (questions.length === 0) return

    setSaving(true)
    try {
      await apiFetch('/api/dashboard/exams', {
        method: 'POST',
        body: JSON.stringify({
          action: 'CREATE_EXAM',
          payload: {
            title,
            subject: 'General Science', // default subject
            type: 'free',
            price: 0,
            count: questions.length,
            randomize: true,
            status: 'publish',
            marks: questions.length * 2,
            duration: questions.length * 2,
            schedule: 'anytime',
            questions
          }
        })
      })

      Alert.alert('Success', 'Exam created and deployed successfully!', [
        { text: 'OK', onPress: () => router.replace('/(teacher)/exams') }
      ])
    } catch (e: any) {
      console.error(e)
      Alert.alert('Failed to deploy exam', e.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-bg-card2">
      {/* Header bar */}
      <View className="flex-row items-center px-5 py-4 bg-white border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-3">
          <ArrowLeft size={20} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-black text-text-primary">AI Exam Generator</Text>
      </View>

      <View className="p-5">
        {/* Form panel */}
        <View className="rounded-3xl bg-white border border-border p-5 shadow-sm space-y-4">
          <View className="flex-row items-center space-x-2 pb-2 border-b border-border mb-3">
            <Sparkles size={18} color="#7C3AED" />
            <Text className="text-sm font-black text-violet-700">Gemini 2.5 Assistant</Text>
          </View>

          {/* Exam Title */}
          <View className="space-y-1">
            <Text className="text-[11px] font-bold text-text-secondary uppercase">Exam Name / Title</Text>
            <TextInput
              className="rounded-xl border border-border bg-bg-card2 px-4 py-2.5 text-base text-text-primary mt-1"
              placeholder="e.g. Physics Force Quiz"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Syllabus */}
          <View className="space-y-1 mt-3">
            <Text className="text-[11px] font-bold text-text-secondary uppercase">Syllabus Framework</Text>
            <TextInput
              className="rounded-xl border border-border bg-bg-card2 px-4 py-2.5 text-base text-text-primary mt-1"
              placeholder="e.g. CBSE Class 10"
              placeholderTextColor="#9CA3AF"
              value={syllabusName}
              onChangeText={setSyllabusName}
            />
          </View>

          {/* Subject */}
          <View className="space-y-1 mt-3">
            <Text className="text-[11px] font-bold text-text-secondary uppercase">Subject Domain</Text>
            <TextInput
              className="rounded-xl border border-border bg-bg-card2 px-4 py-2.5 text-base text-text-primary mt-1"
              placeholder="e.g. Physics"
              placeholderTextColor="#9CA3AF"
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          {/* Questions count */}
          <View className="space-y-1 mt-3">
            <Text className="text-[11px] font-bold text-text-secondary uppercase">Number of Questions</Text>
            <TextInput
              className="rounded-xl border border-border bg-bg-card2 px-4 py-2.5 text-base text-text-primary mt-1"
              keyboardType="numeric"
              value={count}
              onChangeText={setCount}
            />
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={loading}
            className="mt-6 flex-row items-center justify-center rounded-xl bg-violet-600 py-3.5 shadow-sm active:opacity-90"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Sparkles size={16} color="#FFFFFF" />
                <Text className="text-white font-bold text-sm ml-2">Generate Questions</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Generated output */}
        {questions.length > 0 && (
          <View className="mt-6 space-y-4">
            <Text className="text-base font-black text-text-primary mb-2">Generated Questions</Text>
            {questions.map((q, idx) => (
              <View key={idx} className="rounded-2xl bg-white border border-border p-4 shadow-sm mb-3">
                <Text className="text-xs font-bold text-violet-700 uppercase">Question {idx + 1} ({q.difficulty})</Text>
                <Text className="text-sm font-semibold text-text-primary mt-1.5">{q.text}</Text>
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
            ))}

            {/* Deploy Action */}
            <TouchableOpacity
              onPress={handleDeployExam}
              disabled={saving}
              className="mt-4 flex-row items-center justify-center rounded-xl bg-emerald-600 py-4 shadow-md active:opacity-90"
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-white font-bold text-base">Save and Deploy Exam</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
