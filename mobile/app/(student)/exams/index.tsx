import React from 'react'
import { View, Text } from 'react-native'

export default function StudentExams() {
  return (
    <View className="flex-1 bg-bg-card2 items-center justify-center p-6">
      <Text className="text-xl font-black text-text-primary">My Exams</Text>
      <Text className="text-sm text-text-secondary mt-2 text-center">
        Attempt online exams, practice papers, and check your result grades in Phase 3.
      </Text>
    </View>
  )
}
