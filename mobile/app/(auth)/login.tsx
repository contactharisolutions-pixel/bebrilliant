import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react-native'
import { apiFetch, setToken } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { useIdentity } from '../../contexts/IdentityContext'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import { apiFetch, setToken } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { PrimaryButton } from '../../components/ui/PrimaryButton'

const { width: SCREEN_W } = Dimensions.get('window')

// ─── Animated input wrapper ──────────────────────────────────────────────────
function AnimatedInputRow({
  children,
  focused,
}: {
  children: React.ReactNode
  focused: boolean
}) {
  const borderColor = useSharedValue(0)

  useEffect(() => {
    borderColor.value = withTiming(focused ? 1 : 0, { duration: 200 })
  }, [focused])

  const animStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value === 1
      ? 'rgba(0,75,147,1)'
      : 'rgba(226,232,240,1)',
    shadowOpacity: borderColor.value * 0.12,
    transform: [{ scale: 1 + borderColor.value * 0.005 }],
  }))

  return (
    <Animated.View style={[styles.inputRow, animStyle]}>
      {children}
    </Animated.View>
  )
}

// ─── Trust badge ─────────────────────────────────────────────────────────────
function TrustBadge({
  icon: Icon,
  label,
  delay,
}: {
  icon: React.ComponentType<{ size: number; color: string }>
  label: string
  delay: number
}) {
  const opacity    = useSharedValue(0)
  const translateY = useSharedValue(10)

  useEffect(() => {
    opacity.value    = withDelay(delay, withTiming(1, { duration: 400 }))
    translateY.value = withDelay(delay, withSpring(0, { damping: 14 }))
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View style={[styles.trustBadge, animStyle]}>
      <Icon size={13} color="#004B93" />
      <Text style={styles.trustBadgeText}>{label}</Text>
    </Animated.View>
  )
}

// ─── Main Login Screen ────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter()
  const { refresh } = useIdentity()
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null)

  // Hero section entry animation
  const heroOpacity = useSharedValue(0)
  const heroY       = useSharedValue(-20)
  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 600 })
    heroY.value       = withSpring(0, { damping: 14, stiffness: 100 })
  }, [])
  const heroStyle = useAnimatedStyle(() => ({
    opacity:   heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }))

  // Image float animation
  const imgFloat = useSharedValue(0)
  useEffect(() => {
    imgFloat.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming( 0, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    )
  }, [])
  const imgStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: imgFloat.value }],
  }))

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter your email and password')
      return
    }
    setLoading(true)
    try {
      // 1. Authenticate with backend — get JWT token + user role
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      // 2. Persist JWT token in SecureStore
      if (res.token) await setToken(res.token)

      // 3. Authenticate Supabase session in parallel (for realtime/storage)
      supabase.auth.signInWithPassword({ email, password }).catch(() => {
        // Non-critical: Supabase session failure doesn't block login
      })

      // 4. Check role is mobile-supported before proceeding
      const userRole = res.user?.role
      const MOBILE_ROLES = ['student', 'teacher', 'teacher_pending', 'parent', 'owner', 'tenant_admin']
      if (!MOBILE_ROLES.includes(userRole)) {
        Alert.alert('Access Denied', 'Your account role is not enabled for mobile portal.')
        return
      }

      // 5. Refresh IdentityContext — this populates user state and
      //    triggers the navigation guard to route to the correct dashboard
      await refresh()

      // Guard navigates automatically; no manual router.replace() needed
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Incorrect email or password')
    } finally {
      setLoading(false)
    }
  }

  const fillPreset = (type: 'student' | 'teacher' | 'parent') => {
    if (type === 'student')      { setEmail('student@silverbells.in'); setPassword('Demo@123') }
    else if (type === 'teacher') { setEmail('teacher@silverbells.in'); setPassword('Demo@123') }
    else if (type === 'parent')  { setEmail('parent@silverbells.in');  setPassword('Demo@123') }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* ── Background ─────────────────────────────────────────── */}
      <View style={styles.bgGradientTop} />
      <View style={styles.bgOrbBlue} />
      <View style={styles.bgOrbGreen} />
      {/* Diagonal stripe accent */}
      <View style={styles.bgStripe} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ zIndex: 2 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HERO SECTION ─────────────────────────────────────── */}
        <Animated.View style={[styles.heroSection, heroStyle]}>
          {/* Logo card */}
          <View style={styles.logoCard}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Tagline */}
          <Text style={styles.tagline}>
            India's First AI based Smart{'\n'}Education Platform
          </Text>

          {/* Trust badges row */}
          <View style={styles.trustRow}>
            <TrustBadge icon={Zap}    label="AI Powered"   delay={300} />
            <TrustBadge icon={Shield} label="Secure Login"  delay={450} />
          </View>
        </Animated.View>

        {/* ── FORM CARD ─────────────────────────────────────────── */}
        <View style={styles.formCard}>
          {/* Form header */}
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Welcome Back 👋</Text>
            <Text style={styles.formSubtitle}>Sign in to your BeBrilliant account</Text>
          </View>

          {/* Email field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <AnimatedInputRow focused={focusedInput === 'email'}>
              <View style={styles.inputIcon}>
                <Mail size={18} color={focusedInput === 'email' ? '#004B93' : '#94A3B8'} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="student@school.edu"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                onChangeText={setEmail}
              />
            </AnimatedInputRow>
          </View>

          {/* Password field */}
          <View style={[styles.fieldGroup, { marginTop: 14 }]}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={styles.forgotLink}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <AnimatedInputRow focused={focusedInput === 'password'}>
              <View style={styles.inputIcon}>
                <Lock size={18} color={focusedInput === 'password' ? '#004B93' : '#94A3B8'} />
              </View>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword
                  ? <EyeOff size={18} color="#94A3B8" />
                  : <Eye    size={18} color="#94A3B8" />}
              </TouchableOpacity>
            </AnimatedInputRow>
          </View>

          {/* Sign In button */}
          <View style={{ marginTop: 22 }}>
            <PrimaryButton
              title="Sign In to Portal"
              onPress={handleLogin}
              loading={loading}
              iconRight={<ArrowRight size={18} color="#FFFFFF" />}
              size="lg"
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Quick Demo Access</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Demo presets */}
          <View style={styles.presetRow}>
            {[
              { type: 'student' as const, label: 'Student', color: '#004B93', bg: '#EBF3FC' },
              { type: 'teacher' as const, label: 'Teacher', color: '#7C3AED', bg: '#F5F3FF' },
              { type: 'parent'  as const, label: 'Parent',  color: '#059669', bg: '#ECFDF5' },
            ].map(({ type, label, color, bg }) => (
              <TouchableOpacity
                key={type}
                onPress={() => fillPreset(type)}
                style={[styles.presetBtn, { backgroundColor: bg, borderColor: color + '30' }]}
                activeOpacity={0.75}
              >
                <Text style={[styles.presetLabel, { color }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── ACHIEVEMENT ILLUSTRATION ─────────────────────────── */}
        <Animated.View style={[styles.illustrationWrap, imgStyle]}>
          <View style={styles.illustrationCard}>
            <Image
              source={require('../../assets/students_achievement.png')}
              style={styles.illustration}
              resizeMode="contain"
            />
            <View style={styles.illustrationCaption}>
              <Text style={styles.captionTitle}>🏆 Empowering Every Student</Text>
              <Text style={styles.captionSub}>
                Join lakhs of students achieving their best with BeBrilliant
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            BeBrilliant · Enterprise Edition v1.0 · Made in India 🇮🇳
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
  },

  // Background layers
  bgGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: '#003E7E',
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
  },
  bgOrbBlue: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#005EB8',
    opacity: 0.40,
  },
  bgOrbGreen: {
    position: 'absolute',
    top: 140,
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#1A6B3A',
    opacity: 0.22,
  },
  bgStripe: {
    position: 'absolute',
    top: 200,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: '#FFB800',
    opacity: 0.08,
    transform: [{ rotate: '35deg' }],
  },

  // Hero / logo section
  heroSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
    zIndex: 5,
  },
  logoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  logo: {
    width: 220,
    height: 66,
  },
  tagline: {
    marginTop: 18,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.2,
    opacity: 0.92,
  },
  trustRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    shadowColor: '#004B93',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004B93',
    letterSpacing: 0.3,
  },

  // Form card
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#0040A0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 14,
    zIndex: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,75,147,0.06)',
  },
  formHeader: {
    marginBottom: 22,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '500',
  },

  // Input fields
  fieldGroup: { },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004B93',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    backgroundColor: '#F8FAFF',
    shadowColor: '#004B93',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 0,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 14,
    paddingRight: 12,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 14,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Demo presets
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Achievement illustration
  illustrationWrap: {
    marginHorizontal: 18,
    marginTop: 20,
    zIndex: 4,
  },
  illustrationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#004B93',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,75,147,0.06)',
  },
  illustration: {
    width: '100%',
    height: 200,
  },
  illustrationCaption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F8FAFF',
    borderTopWidth: 1,
    borderTopColor: '#EBF3FC',
    alignItems: 'center',
  },
  captionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  captionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 0.5,
    fontWeight: '500',
    textAlign: 'center',
  },
})
