import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native'
import { apiFetch, setToken } from '../../lib/api'
import { supabase } from '../../lib/supabase'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      // 1. Call Next.js login endpoint
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      // 2. Store the JWT token for API calls
      if (res.token) {
        await setToken(res.token)
      }

      // 3. Log in to Supabase using client too (optional, but ensures client RLS works)
      await supabase.auth.signInWithPassword({ email, password })

      // 4. Redirect based on role
      const userRole = res.user?.role
      if (userRole === 'teacher') {
        router.replace('/(teacher)/dashboard')
      } else if (userRole === 'student') {
        router.replace('/(student)/dashboard')
      } else if (userRole === 'parent') {
        router.replace('/(parent)/dashboard')
      } else if (userRole === 'owner' || userRole === 'tenant_admin') {
        // Fallback for administrative roles who might log in to test
        router.replace('/(teacher)/dashboard')
      } else {
        Alert.alert('Access Denied', 'Your account role is not supported on mobile.')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      Alert.alert('Login Failed', error.message || 'Incorrect email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="justify-center px-6 py-12">
        <View className="mb-8 items-center">
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: 250, height: 60 }}
            resizeMode="contain"
          />
          <Text className="mt-2 text-center text-sm font-medium text-text-secondary">
            Empowering institutional excellence through technology
          </Text>
        </View>

        <View className="space-y-5">
          {/* Email Input */}
          <View className="space-y-1">
            <Text className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Email Address
            </Text>
            <View className="relative flex-row items-center rounded-xl border border-border bg-bg-card2 px-4 focus-within:border-primary">
              <Mail size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                placeholder="email@institution.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="space-y-1 mt-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Password
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text className="text-xs font-semibold text-primary">Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View className="relative flex-row items-center rounded-xl border border-border bg-bg-card2 px-4 focus-within:border-primary">
              <Lock size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                placeholder="Enter password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className="mt-6 flex-row items-center justify-center rounded-xl bg-primary py-4 shadow-lg shadow-primary/20 active:opacity-90"
            disabled={loading}
            onPress={handleLogin}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text className="text-base font-bold text-white mr-2">Sign In</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-10 items-center">
          <Text className="text-xs text-text-muted">
            BeBrilliant App · Connected to Institutional Server
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
