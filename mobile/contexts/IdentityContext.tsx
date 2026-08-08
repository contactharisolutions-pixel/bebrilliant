import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, useSegments, SplashScreen } from 'expo-router'
import { Platform } from 'react-native'
import { apiFetch, clearToken, getToken } from '../lib/api'
import { supabase } from '../lib/supabase'
import { usePushNotifications } from '../hooks/usePushNotifications'

interface UserIdentity {
  id: string
  email: string
  role: 'owner' | 'tenant_admin' | 'teacher' | 'teacher_pending' | 'student' | 'parent'
  fullName: string
  tenant_id: string | null
  tenant?: {
    name: string
    logo_url: string | null
    tenant_type: string
  } | null
}

interface IdentityContextProps {
  user: UserIdentity | null
  loading: boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const IdentityContext = createContext<IdentityContextProps | undefined>(undefined)

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserIdentity | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()

  usePushNotifications(user?.id)

  const refresh = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) {
        setUser(null)
        return
      }
      const res = await apiFetch('/api/auth/me')
      setUser(res)
    } catch (e) {
      console.warn('Authentication token expired or invalid:', e)
      await clearToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = async () => {
    setLoading(true)
    try {
      await clearToken()
      await supabase.auth.signOut()
      setUser(null)
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      setLoading(false)
    }
  }

  // Bootstrap auth on first mount
  useEffect(() => {
    refresh()
  }, [])

  // Navigation Guard — only runs when auth is fully resolved (loading === false)
  useEffect(() => {
    if (loading) return

    // Hide the splash screen now that we know the auth state (native only)
    if (Platform.OS !== 'web') {
      SplashScreen.hideAsync().catch(() => {})
    }

    const inAuthGroup = segments[0] === '(auth)'
    const hasUser = !!user

    try {
      if (!hasUser && !inAuthGroup) {
        router.replace('/(auth)/onboarding')
      } else if (hasUser && inAuthGroup) {
        if (
          user.role === 'teacher' ||
          user.role === 'teacher_pending' ||
          user.role === 'owner' ||
          user.role === 'tenant_admin'
        ) {
          router.replace('/(teacher)/dashboard')
        } else if (user.role === 'student') {
          router.replace('/(student)/dashboard')
        } else if (user.role === 'parent') {
          router.replace('/(parent)/dashboard')
        } else {
          router.replace('/(teacher)/dashboard')
        }
      }
    } catch (e) {
      console.warn('Navigation guard error:', e)
    }
  }, [user, segments, loading])

  return (
    <IdentityContext.Provider value={{ user, loading, logout, refresh }}>
      {children}
    </IdentityContext.Provider>
  )
}

export function useIdentity() {
  const context = useContext(IdentityContext)
  if (!context) {
    throw new Error('useIdentity must be used within an IdentityProvider')
  }
  return context
}
