import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useIdentity } from '../../../contexts/IdentityContext'
import { Award, Users, CreditCard, ChevronRight } from 'lucide-react-native'

export default function ParentDashboard() {
  const { user } = useIdentity()

  return (
    <ScrollView className="flex-1 bg-bg-card2 px-5 py-6">
      {/* Welcome Card */}
      <View className="rounded-3xl bg-primary p-6 shadow-lg shadow-primary/20">
        <Text className="text-xs font-bold uppercase tracking-wider text-white/70">
          Parent Dashboard
        </Text>
        <Text className="mt-1 text-2xl font-black text-white">
          {user?.fullName || 'Parent'}
        </Text>
        <Text className="mt-2 text-sm text-white/80">
          Tenant: {user?.tenant?.name || 'BrightBoard Institution'}
        </Text>
      </View>

      {/* Linked Children Card */}
      <View className="mt-6 rounded-2xl bg-white border border-border p-5 shadow-sm flex-row justify-between items-center">
        <View>
          <Text className="text-xs font-bold uppercase text-text-secondary tracking-wide">
            Linked Students
          </Text>
          <Text className="text-xl font-black text-text-primary mt-1">Aarav Sharma</Text>
          <Text className="text-xs text-text-muted mt-0.5">Grade 11 · Batch Alpha</Text>
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Users size={24} color="#004B93" />
        </View>
      </View>

      {/* KPI Cards */}
      <View className="mt-6 flex-row justify-between">
        <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-success/10 mb-3">
            <Award size={20} color="#1FAC63" />
          </View>
          <Text className="text-2xl font-black text-text-primary">92%</Text>
          <Text className="text-xs font-bold text-text-secondary mt-1">Recent Exam Score</Text>
        </View>

        <View className="w-[48%] rounded-2xl bg-white border border-border p-4 shadow-sm">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-red-50 mb-3">
            <CreditCard size={20} color="#EF4444" />
          </View>
          <Text className="text-2xl font-black text-red-600">₹2,500</Text>
          <Text className="text-xs font-bold text-text-secondary mt-1">Pending Fees</Text>
        </View>
      </View>

      {/* Quick Action */}
      <View className="mt-8 mb-10">
        <Text className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
          Recent Notifications
        </Text>
        <TouchableOpacity className="flex-row items-center justify-between rounded-2xl bg-white border border-border p-4 shadow-sm">
          <View className="flex-row items-center flex-1 pr-4">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mr-4">
              <Award size={22} color="#004B93" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-text-primary" numberOfLines={1}>
                Report Card Published
              </Text>
              <Text className="text-xs text-text-muted mt-0.5">Aarav Sharma scored 92% in Mathematics</Text>
            </View>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
