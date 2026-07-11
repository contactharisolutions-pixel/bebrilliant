import React from 'react'
import { View, Text } from 'react-native'

export default function StudentWallet() {
  return (
    <View className="flex-1 bg-bg-card2 items-center justify-center p-6">
      <Text className="text-xl font-black text-text-primary">Affiliate Wallet</Text>
      <Text className="text-sm text-text-secondary mt-2 text-center">
        Refer fellow students, earn credits, and apply them on checkout in Phase 3.
      </Text>
    </View>
  )
}
