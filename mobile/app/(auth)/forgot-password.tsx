import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Mail, ArrowLeft } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'bebrilliant://reset-password',
      })
      if (error) throw error
      setSent(true)
    } catch (error: any) {
      console.error('Password reset error:', error)
      Alert.alert('Reset Failed', error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-12 justify-between">
        <View>
          {/* Back button */}
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="h-10 w-10 items-center justify-center rounded-full bg-bg-card2 border border-border"
          >
            <ArrowLeft size={20} color="#1F2937" />
          </TouchableOpacity>

          <View className="mt-8 mb-8">
            <Text className="text-3xl font-black tracking-tight text-text-primary">
              Forgot Password
            </Text>
            <Text className="mt-2 text-base text-text-secondary">
              Enter your registered email address and we'll send you instructions to reset your password.
            </Text>
          </View>

          {sent ? (
            <View className="rounded-2xl bg-success/10 border border-success/20 p-5 items-center">
              <Text className="text-base font-bold text-success text-center">
                Reset Link Sent!
              </Text>
              <Text className="mt-2 text-sm text-text-secondary text-center">
                Please check your inbox at {email} for the verification link to change your password.
              </Text>
            </View>
          ) : (
            <View className="space-y-4">
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

              <TouchableOpacity
                className="mt-6 flex-row items-center justify-center rounded-xl bg-primary py-4 shadow-lg shadow-primary/20 active:opacity-90"
                disabled={loading}
                onPress={handleReset}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-base font-bold text-white">Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity 
          onPress={() => router.replace('/(auth)/login')} 
          className="items-center py-4"
        >
          <Text className="text-sm font-semibold text-primary">Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
