import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useIdentity } from '../../contexts/IdentityContext'

export default function TeacherProfile() {
  const { user, logout } = useIdentity()

  return (
    <View className="flex-1 bg-bg-card2 p-6 justify-between">
      <View className="items-center mt-10">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary mb-4">
          <Text className="text-3xl font-black text-white">
            {user?.fullName?.charAt(0) || 'T'}
          </Text>
        </View>
        <Text className="text-2xl font-black text-text-primary">{user?.fullName}</Text>
        <Text className="text-sm text-text-secondary mt-1">{user?.email}</Text>
        <View className="mt-4 rounded-full bg-primary/10 px-4 py-1">
          <Text className="text-xs font-bold text-primary uppercase">{user?.role}</Text>
        </View>
      </View>

      <TouchableOpacity 
        onPress={logout}
        className="rounded-xl border border-red-200 bg-red-50 py-4 items-center active:opacity-90 mb-10"
      >
        <Text className="text-base font-bold text-red-600">Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}
