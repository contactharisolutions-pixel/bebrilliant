import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, User, Calendar, Check, X, Clock } from 'lucide-react-native'
import { useStudents } from '../../../hooks/useStudents'
import { apiFetch } from '../../../lib/api'

export default function StudentDetails() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { data: students, isLoading } = useStudents()
  const [marking, setMarking] = useState(false)
  const [currentAttendanceStatus, setCurrentAttendanceStatus] = useState<'present' | 'absent' | 'late' | null>(null)

  const student = students?.find(s => s.id === id)

  const submitAttendance = async (status: 'present' | 'absent' | 'late') => {
    if (!student) return

    setMarking(true)
    try {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      await apiFetch('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({
          date: today,
          records: [
            {
              student_id: student.id,
              status
            }
          ]
        })
      })
      setCurrentAttendanceStatus(status)
      Alert.alert('Success', `Attendance marked as ${status} for today`)
    } catch (e: any) {
      console.error(e)
      Alert.alert('Failure', e.message || 'Failed to submit attendance')
    } finally {
      setMarking(false)
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center">
        <ActivityIndicator size="large" color="#004B93" />
      </View>
    )
  }

  if (!student) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center p-6">
        <Text className="text-base text-red-600 font-bold">Student not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-primary px-6 py-2.5 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const studentClass = (student.metadata as any)?.school_class || (student.metadata as any)?.class || 'N/A'
  const studentDiv = (student.metadata as any)?.division || 'N/A'

  return (
    <ScrollView className="flex-1 bg-bg-card2">
      {/* Header Bar */}
      <View className="flex-row items-center px-5 py-4 bg-white border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-3">
          <ArrowLeft size={20} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-black text-text-primary">Student Profile</Text>
      </View>

      <View className="p-5">
        {/* Profile Card */}
        <View className="items-center rounded-3xl bg-white border border-border p-6 shadow-sm">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary mb-4">
            <Text className="text-3xl font-black text-white">
              {student.first_name?.charAt(0) || 'S'}
            </Text>
          </View>
          <Text className="text-2xl font-black text-text-primary">
            {student.first_name} {student.last_name || ''}
          </Text>
          <Text className="text-sm text-text-secondary mt-1">{student.email}</Text>
          <View className="mt-4 flex-row space-x-6">
            <View className="items-center px-4">
              <Text className="text-xs font-semibold text-text-muted">Class</Text>
              <Text className="text-lg font-bold text-text-primary mt-1">{studentClass}</Text>
            </View>
            <View className="items-center border-l border-border px-6">
              <Text className="text-xs font-semibold text-text-muted">Section</Text>
              <Text className="text-lg font-bold text-text-primary mt-1">{studentDiv}</Text>
            </View>
          </View>
        </View>

        {/* Attendance Marker Widget */}
        <View className="mt-6 rounded-3xl bg-white border border-border p-6 shadow-sm">
          <Text className="text-base font-black text-text-primary mb-4">
            Mark Today's Attendance
          </Text>
          <View className="flex-row justify-between">
            {/* Present Button */}
            <TouchableOpacity
              onPress={() => submitAttendance('present')}
              disabled={marking}
              className={`w-[30%] items-center py-4 rounded-2xl border ${
                currentAttendanceStatus === 'present'
                  ? 'bg-emerald-50 border-emerald-500'
                  : 'bg-bg-card2 border-border'
              }`}
            >
              <Check size={24} color={currentAttendanceStatus === 'present' ? '#10B981' : '#9CA3AF'} />
              <Text className={`text-xs font-bold mt-2 ${
                currentAttendanceStatus === 'present' ? 'text-emerald-700' : 'text-text-secondary'
              }`}>Present</Text>
            </TouchableOpacity>

            {/* Late Button */}
            <TouchableOpacity
              onPress={() => submitAttendance('late')}
              disabled={marking}
              className={`w-[30%] items-center py-4 rounded-2xl border ${
                currentAttendanceStatus === 'late'
                  ? 'bg-amber-50 border-amber-500'
                  : 'bg-bg-card2 border-border'
              }`}
            >
              <Clock size={24} color={currentAttendanceStatus === 'late' ? '#F59E0B' : '#9CA3AF'} />
              <Text className={`text-xs font-bold mt-2 ${
                currentAttendanceStatus === 'late' ? 'text-amber-700' : 'text-text-secondary'
              }`}>Late</Text>
            </TouchableOpacity>

            {/* Absent Button */}
            <TouchableOpacity
              onPress={() => submitAttendance('absent')}
              disabled={marking}
              className={`w-[30%] items-center py-4 rounded-2xl border ${
                currentAttendanceStatus === 'absent'
                  ? 'bg-red-50 border-red-500'
                  : 'bg-bg-card2 border-border'
              }`}
            >
              <X size={24} color={currentAttendanceStatus === 'absent' ? '#EF4444' : '#9CA3AF'} />
              <Text className={`text-xs font-bold mt-2 ${
                currentAttendanceStatus === 'absent' ? 'text-red-700' : 'text-text-secondary'
              }`}>Absent</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mock Analytics KPI */}
        <View className="mt-6 rounded-3xl bg-white border border-border p-6 shadow-sm">
          <Text className="text-base font-black text-text-primary mb-4">Performance Summary</Text>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs font-semibold text-text-muted">Attendance Rate</Text>
              <Text className="text-xl font-bold text-emerald-600 mt-1">94.2%</Text>
            </View>
            <View>
              <Text className="text-xs font-semibold text-text-muted">Last Exam Grade</Text>
              <Text className="text-xl font-bold text-primary mt-1">A (88%)</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
