import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { apiFetch, clearToken, getToken } from '../lib/api'
import { supabase } from '../lib/supabase'
import { usePushNotifications } from '../hooks/usePushNotifications'

interface UserIdentity {
  id: string
  email: string
  role: 'owner' | 'tenant_admin' | 'teacher' | 'student' | 'parent'
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

  const refresh = async () => {
    try {
      const token = await getToken()
      if (!token) {
        setUser(null)
        setLoading(false)
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
  }

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

  useEffect(() => {
    refresh()
  }, [])

  // Navigation Guard / Role Routing
  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === '(auth)'
    const hasUser = !!user

    if (!hasUser && !inAuthGroup) {
      // Redirect to onboarding or login if unauthenticated
      router.replace('/(auth)/onboarding')
    } else if (hasUser && inAuthGroup) {
      // Redirect to respective dashboard if authenticated
      if (user.role === 'teacher') {
        router.replace('/(teacher)/dashboard')
      } else if (user.role === 'student') {
        router.replace('/(student)/dashboard')
      } else if (user.role === 'parent') {
        router.replace('/(parent)/dashboard')
      } else {
        router.replace('/(teacher)/dashboard')
      }
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
