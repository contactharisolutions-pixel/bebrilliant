import { useEffect } from 'react'
import { Slot, SplashScreen } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { IdentityProvider } from '../contexts/IdentityContext'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import '../global.css'

import { Platform } from 'react-native'

const queryClient = new QueryClient()

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      SplashScreen.preventAutoHideAsync().catch(() => {})
    }
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <IdentityProvider>
          <Slot />
        </IdentityProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
