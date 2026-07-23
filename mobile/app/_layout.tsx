import { useEffect } from 'react'
import { Slot, SplashScreen } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { IdentityProvider } from '../contexts/IdentityContext'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import '../global.css'

import { Platform } from 'react-native'

// Prevent the splash screen from auto-hiding before auth state is resolved (native platforms).
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {})
}

const queryClient = new QueryClient()

export default function RootLayout() {
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
