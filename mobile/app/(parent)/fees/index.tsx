import React from 'react'
import { View, Text } from 'react-native'

export default function ParentFees() {
  return (
    <View className="flex-1 bg-bg-card2 items-center justify-center p-6">
      <Text className="text-xl font-black text-text-primary">Fee Payments</Text>
      <Text className="text-sm text-text-secondary mt-2 text-center">
        Pay outstanding tuition fees and download receipt PDF records in Phase 4.
      </Text>
    </View>
  )
}
