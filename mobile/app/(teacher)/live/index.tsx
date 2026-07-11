import React from 'react'
import { View, Text } from 'react-native'

export default function TeacherLive() {
  return (
    <View className="flex-1 bg-bg-card2 items-center justify-center p-6">
      <Text className="text-xl font-black text-text-primary">Live Sessions</Text>
      <Text className="text-sm text-text-secondary mt-2 text-center">
        Schedule and launch real-time video classrooms from this module in Phase 2.
      </Text>
    </View>
  )
}
