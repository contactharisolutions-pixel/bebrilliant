import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useIdentity } from '../../../contexts/IdentityContext'
import { Award, Users, Video, BookOpen, PlusCircle } from 'lucide-react-native'

export default function TeacherDashboard() {
  const { user } = useIdentity()

  return (
    <ScrollView className="flex-1 bg-bg-card2 px-5 py-6">
      {/* Welcome Card */}
      <View className="rounded-3xl bg-primary p-6 shadow-lg shadow-primary/20">
        <Text className="text-xs font-bold uppercase tracking-wider text-white/70">
          Welcome Back
        </Text>
        <Text className="mt-1 text-2xl font-black text-white">
          {user?.fullName || 'Educator'}
        </Text>
        <Text className="mt-2 text-sm text-white/80">
          Tenant: {user?.tenant?.name || 'BrightBoard Institution'}
        </Text>
      </View>

      {/* KPI Cards */}
      <View className="mt-8 flex-row justify-between">
        <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-3">
            <Users size={20} color="#004B93" />
          </View>
          <Text className="text-2xl font-black text-text-primary">148</Text>
          <Text className="text-xs font-bold text-text-secondary mt-1">Enrolled Students</Text>
        </View>

        <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-success/10 mb-3">
            <BookOpen size={20} color="#1FAC63" />
          </View>
          <Text className="text-2xl font-black text-text-primary">24</Text>
          <Text className="text-xs font-bold text-text-secondary mt-1">Active Exams</Text>
        </View>
      </View>

      {/* Quick Action */}
      <View className="mt-8">
        <Text className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
          Quick Actions
        </Text>
        <View className="space-y-4">
          <TouchableOpacity className="flex-row items-center justify-between rounded-2xl bg-white border border-border p-4 shadow-sm">
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mr-4">
                <PlusCircle size={20} color="#004B93" />
              </View>
              <View>
                <Text className="text-base font-bold text-text-primary">Create New Exam</Text>
                <Text className="text-xs text-text-muted mt-0.5">Author questions with AI proctoring</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between rounded-2xl bg-white border border-border p-4 shadow-sm mt-4">
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-success/10 mr-4">
                <Video size={20} color="#1FAC63" />
              </View>
              <View>
                <Text className="text-base font-bold text-text-primary">Start Live Session</Text>
                <Text className="text-xs text-text-muted mt-0.5">Broadcast Zoom video connection</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}
