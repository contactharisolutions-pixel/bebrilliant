import React from 'react'
import { View, Text } from 'react-native'

export default function ParentChildren() {
  return (
    <View className="flex-1 bg-bg-card2 items-center justify-center p-6">
      <Text className="text-xl font-black text-text-primary">Child Performance</Text>
      <Text className="text-sm text-text-secondary mt-2 text-center">
        Monitor report cards, attendance logs, and AI progress evaluations in Phase 4.
      </Text>
    </View>
  )
}
