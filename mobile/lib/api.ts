import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'http://localhost:3000'
const TOKEN_KEY = 'bb_token'

export async function setToken(token: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, token)
    }
    return
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function getToken() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(TOKEN_KEY)
    }
    return null
  }
  return await SecureStore.getItemAsync(TOKEN_KEY)
}

export async function clearToken() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY)
    }
    return
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken()
  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const url = path.startsWith('http') ? path : `${SITE_URL}${path}`

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}
