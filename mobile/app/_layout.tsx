import { Slot } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { IdentityProvider } from '../contexts/IdentityContext'
import '../global.css'

const queryClient = new QueryClient()

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <IdentityProvider>
        <Slot />
      </IdentityProvider>
    </QueryClientProvider>
  )
}
