import { Slot } from 'expo-router'
import { IdentityProvider } from '../contexts/IdentityContext'
import '../global.css'

export default function RootLayout() {
  return (
    <IdentityProvider>
      <Slot />
    </IdentityProvider>
  )
}
