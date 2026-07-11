import React, { useState } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Mail, Phone, Search, ChevronRight, User } from 'lucide-react-native'
import { useStudents } from '../../../hooks/useStudents'

export default function StudentRoster() {
  const router = useRouter()
  const { data: students, isLoading, error, refetch } = useStudents()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStudents = students?.filter(student => {
    const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase()
    const email = (student.email || '').toLowerCase()
    return fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase())
  })

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center">
        <ActivityIndicator size="large" color="#004B93" />
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center p-6">
        <Text className="text-base text-red-600 font-bold">Failed to load students</Text>
        <TouchableOpacity onPress={() => refetch()} className="mt-4 bg-primary px-6 py-2.5 rounded-xl">
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-bg-card2">
      {/* Search Header */}
      <View className="px-5 py-4 bg-white border-b border-border">
        <View className="flex-row items-center rounded-xl border border-border bg-bg-card2 px-4 py-1">
          <Search size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 py-2.5 pl-3 text-base text-text-primary"
            placeholder="Search students..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Roster List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <User size={48} color="#9CA3AF" />
            <Text className="text-base font-bold text-text-secondary mt-4">No students found</Text>
          </View>
        }
        renderItem={({ item }) => {
          const studentClass = (item.metadata as any)?.school_class || (item.metadata as any)?.class || 'N/A'
          const studentDiv = (item.metadata as any)?.division || 'N/A'

          return (
            <TouchableOpacity
              onPress={() => router.push(`/(teacher)/students/${item.id}`)}
              className="flex-row items-center justify-between rounded-2xl bg-white border border-border p-4 shadow-sm mb-4 active:opacity-90"
            >
              <View className="flex-row items-center flex-1 pr-4">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10 mr-4">
                  <Text className="text-lg font-black text-primary">
                    {item.first_name?.charAt(0) || 'S'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-black text-text-primary" numberOfLines={1}>
                    {item.first_name} {item.last_name || ''}
                  </Text>
                  <Text className="text-xs text-text-secondary mt-0.5">
                    Class {studentClass} · Section {studentDiv}
                  </Text>
                  <View className="flex-row items-center mt-2 space-x-4">
                    <View className="flex-row items-center">
                      <Mail size={12} color="#9CA3AF" />
                      <Text className="text-xs text-text-muted ml-1" numberOfLines={1}>
                        {item.email}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}
