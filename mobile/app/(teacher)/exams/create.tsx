import React, { useState } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { ArrowLeft, BookOpen } from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'

export default function CreateExam() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('Science')
  const [count, setCount] = useState('10')
  const [marks, setMarks] = useState('20')
  const [duration, setDuration] = useState('30')

  const handleCreate = async () => {
    if (!title || !subject || !count || !marks || !duration) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setSaving(true)
    try {
      await apiFetch('/api/dashboard/exams', {
        method: 'POST',
        body: JSON.stringify({
          action: 'CREATE_EXAM',
          payload: {
            title,
            subject: 'General Science', // default syllabus ID
            type: 'free',
            price: 0,
            count: Number(count),
            randomize: true,
            status: 'publish',
            marks: Number(marks),
            duration: Number(duration),
            schedule: 'anytime',
            questions: [] // empty question list for draft/manual
          }
        })
      })

      Alert.alert('Success', 'Exam created successfully!', [
        { text: 'OK', onPress: () => router.replace('/(teacher)/exams') }
      ])
    } catch (e: any) {
      console.error(e)
      Alert.alert('Creation Failed', e.message || 'Something went wrong.')
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
        <Text className="text-lg font-black text-text-primary">Create Exam</Text>
      </View>

      <View className="p-5">
        <View className="rounded-3xl bg-white border border-border p-5 shadow-sm space-y-4">
          {/* Exam Title */}
          <View className="space-y-1">
            <Text className="text-[11px] font-bold text-text-secondary uppercase">Exam Name / Title</Text>
            <TextInput
              className="rounded-xl border border-border bg-bg-card2 px-4 py-2.5 text-base text-text-primary mt-1"
              placeholder="e.g. Science Chapter 1 Quiz"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Subject */}
          <View className="space-y-1 mt-3">
            <Text className="text-[11px] font-bold text-text-secondary uppercase">Subject Domain</Text>
            <TextInput
              className="rounded-xl border border-border bg-bg-card2 px-4 py-2.5 text-base text-text-primary mt-1"
              placeholder="e.g. Science"
              placeholderTextColor="#9CA3AF"
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          {/* Question count */}
          <View className="space-y-1 mt-3">
            <Text className="text-[11px] font-bold text-text-secondary uppercase">Number of Questions</Text>
            <TextInput
              className="rounded-xl border border-border bg-bg-card2 px-4 py-2.5 text-base text-text-primary mt-1"
              keyboardType="numeric"
              value={count}
              onChangeText={setCount}
            />
          </View>

          {/* Total Marks */}
          <View className="space-y-1 mt-3">
            <Text className="text-[11px] font-bold text-text-secondary uppercase">Total Marks</Text>
            <TextInput
              className="rounded-xl border border-border bg-bg-card2 px-4 py-2.5 text-base text-text-primary mt-1"
              keyboardType="numeric"
              value={marks}
              onChangeText={setMarks}
            />
          </View>

          {/* Duration */}
          <View className="space-y-1 mt-3">
            <Text className="text-[11px] font-bold text-text-secondary uppercase">Duration (Minutes)</Text>
            <TextInput
              className="rounded-xl border border-border bg-bg-card2 px-4 py-2.5 text-base text-text-primary mt-1"
              keyboardType="numeric"
              value={duration}
              onChangeText={setDuration}
            />
          </View>

          {/* Action */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={saving}
            className="mt-6 flex-row items-center justify-center rounded-xl bg-primary py-4 shadow-sm active:opacity-90"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white font-bold text-base">Create Exam</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}
