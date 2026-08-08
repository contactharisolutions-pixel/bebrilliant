import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  BookOpen,
  Award,
  Users,
  ChevronRight,
  GraduationCap,
  Brain,
  Calculator,
  Microscope,
  PenTool,
  Globe,
  Clock,
  Star,
  Lightbulb,
  Target,
  TrendingUp,
  CheckCircle,
} from 'lucide-react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated'
import { PrimaryButton } from '../../components/ui/PrimaryButton'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

// ─── Slide definitions ──────────────────────────────────────────────────────
const SLIDES = [
  {
    title: 'Achieve Academic\nExcellence',
    subtitle: 'BeBrilliant Platform',
    desc: 'Empowering institutions, teachers, students, and parents in a single unified mobile suite.',
    icon: BookOpen,
    accentColor: '#004B93',
    accentBg: '#EBF3FC',
    badge: '✦  All-in-One Platform',
    feature1: 'Smart Scheduling',
    feature2: 'Live Classes',
    feature3: 'Homework Tracker',
  },
  {
    title: 'Smart AI &\nTest Analytics',
    subtitle: 'BeBrilliant Exams',
    desc: 'Attempt online exams, get instant AI-powered grading and monitor score trajectories in real-time.',
    icon: Award,
    accentColor: '#059669',
    accentBg: '#ECFDF5',
    badge: '✦  AI Grading Engine',
    feature1: 'Auto Evaluation',
    feature2: 'Score Insights',
    feature3: 'Rank Tracker',
  },
  {
    title: 'Seamless Parent\n& Staff Hub',
    subtitle: 'BeBrilliant Connect',
    desc: 'Stay informed on daily attendance, wallet credits, fee payments, and live classroom streams.',
    icon: Users,
    accentColor: '#7C3AED',
    accentBg: '#F5F3FF',
    badge: '✦  Complete Oversight',
    feature1: 'Attendance Alerts',
    feature2: 'Fee Payments',
    feature3: 'Progress Reports',
  },
]

// ─── Background floating icon positions ─────────────────────────────────────
const BG_ICONS = [
  { Icon: GraduationCap,  x: 0.08,  y: 0.10, size: 36, delay: 0    },
  { Icon: Calculator,     x: 0.78,  y: 0.08, size: 28, delay: 400  },
  { Icon: Brain,          x: 0.85,  y: 0.25, size: 32, delay: 200  },
  { Icon: Microscope,     x: 0.05,  y: 0.28, size: 28, delay: 600  },
  { Icon: PenTool,        x: 0.70,  y: 0.40, size: 26, delay: 300  },
  { Icon: Globe,          x: 0.12,  y: 0.48, size: 30, delay: 500  },
  { Icon: Clock,          x: 0.82,  y: 0.60, size: 26, delay: 100  },
  { Icon: Star,           x: 0.05,  y: 0.65, size: 24, delay: 700  },
  { Icon: Lightbulb,      x: 0.75,  y: 0.75, size: 30, delay: 250  },
  { Icon: Target,         x: 0.10,  y: 0.82, size: 26, delay: 450  },
  { Icon: TrendingUp,     x: 0.82,  y: 0.88, size: 28, delay: 350  },
  { Icon: BookOpen,       x: 0.45,  y: 0.05, size: 22, delay: 550  },
  { Icon: CheckCircle,    x: 0.45,  y: 0.90, size: 24, delay: 150  },
]

// ─── Floating Background Icon ────────────────────────────────────────────────
function FloatingIcon({
  Icon, x, y, size, delay,
}: {
  Icon: React.ComponentType<{ size: number; color: string }>
  x: number; y: number; size: number; delay: number
}) {
  const translateY = useSharedValue(0)
  const opacity    = useSharedValue(0)

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.8, { duration: 800 }))
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 2200 + delay * 0.3, easing: Easing.inOut(Easing.sin) }),
          withTiming(  0, { duration: 2200 + delay * 0.3, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    )
  }, [delay])

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x * SCREEN_W - size / 2,
          top:  y * SCREEN_H - size / 2,
        },
        animStyle,
      ]}
    >
      <Icon size={size} color="#004B93" />
    </Animated.View>
  )
}

// ─── Animated Slide Icon ─────────────────────────────────────────────────────
function SlideIconDisplay({
  icon: Icon,
  color,
  bg,
  slideKey,
}: {
  icon: React.ComponentType<{ size: number; color: string }>
  color: string
  bg: string
  slideKey: number
}) {
  const scale   = useSharedValue(0.6)
  const opacity = useSharedValue(0)
  const rotate  = useSharedValue(-8)
  const pulse   = useSharedValue(1)

  useEffect(() => {
    scale.value   = withDelay(100, withSpring(1, { damping: 12, stiffness: 180 }))
    opacity.value = withDelay(80,  withTiming(1, { duration: 300 }))
    rotate.value  = withDelay(100, withSpring(0,  { damping: 14, stiffness: 160 }))

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.00, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    )
  }, [slideKey])

  const iconStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [
      { scale:  scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }))

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }))

  return (
    <Animated.View style={pulseStyle}>
      <Animated.View
        style={[
          iconStyle,
          {
            width: 148,
            height: 148,
            borderRadius: 74,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: color,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.22,
            shadowRadius: 20,
            elevation: 10,
          },
        ]}
      >
        <Icon size={66} color={color} />
      </Animated.View>
    </Animated.View>
  )
}

// ─── Feature Pill ─────────────────────────────────────────────────────────────
function FeaturePill({ label, color, delay }: { label: string; color: string; delay: number }) {
  const opacity    = useSharedValue(0)
  const translateY = useSharedValue(8)

  useEffect(() => {
    opacity.value    = withDelay(delay, withTiming(1,  { duration: 320 }))
    translateY.value = withDelay(delay, withSpring(0,  { damping: 14, stiffness: 180 }))
  }, [label])

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View style={[styles.featurePill, { borderColor: color + '30' }, animStyle]}>
      <View style={[styles.featureDot, { backgroundColor: color }]} />
      <Text style={[styles.featureText, { color }]}>{label}</Text>
    </Animated.View>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router       = useRouter()
  const [current, setCurrent] = useState(0)

  const titleOpacity    = useSharedValue(1)
  const titleTranslateX = useSharedValue(0)

  const goToSlide = (next: number) => {
    const dir = next > current ? -40 : 40
    titleOpacity.value    = withTiming(0, { duration: 160 })
    titleTranslateX.value = withTiming(dir, { duration: 160 }, () => {
      titleTranslateX.value = -dir
      titleOpacity.value    = withTiming(1, { duration: 250 })
      titleTranslateX.value = withSpring(0, { damping: 14, stiffness: 180 })
    })
    setCurrent(next)
  }

  const handleNext = () => {
    if (current < SLIDES.length - 1) goToSlide(current + 1)
    else router.replace('/(auth)/login')
  }

  const slide = SLIDES[current]

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity:   titleOpacity.value,
    transform: [{ translateX: titleTranslateX.value }],
  }))

  return (
    <View style={styles.container}>
      {/* ── White background with floating educational icons ── */}
      {BG_ICONS.map((item, i) => (
        <FloatingIcon key={i} {...item} />
      ))}

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={styles.skipBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* ── Slide content ── */}
      <View style={styles.slideArea}>

        {/* Badge */}
        <Animated.View
          key={current + 'badge'}
          style={[styles.badge, { backgroundColor: slide.accentBg }]}
        >
          <Text style={[styles.badgeText, { color: slide.accentColor }]}>
            {slide.badge}
          </Text>
        </Animated.View>

        {/* Animated icon */}
        <View style={styles.iconWrap}>
          <SlideIconDisplay
            key={current}
            slideKey={current}
            icon={slide.icon}
            color={slide.accentColor}
            bg={slide.accentBg}
          />
        </View>

        {/* Title + subtitle */}
        <Animated.View style={[styles.textBlock, titleAnimStyle]}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={[styles.subtitle, { color: slide.accentColor }]}>
            {slide.subtitle}
          </Text>
          <Text style={styles.desc}>{slide.desc}</Text>
        </Animated.View>

        {/* Feature pills */}
        <View style={styles.pillRow}>
          <FeaturePill label={slide.feature1} color={slide.accentColor} delay={200} />
          <FeaturePill label={slide.feature2} color={slide.accentColor} delay={320} />
          <FeaturePill label={slide.feature3} color={slide.accentColor} delay={440} />
        </View>
      </View>

      {/* ── Bottom: dots + button ── */}
      <View style={styles.bottom}>
        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goToSlide(i)} activeOpacity={0.7}>
              <Animated.View
                style={[
                  styles.dot,
                  i === current
                    ? [styles.dotActive, { backgroundColor: slide.accentColor }]
                    : styles.dotInactive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA button */}
        <PrimaryButton
          title={current === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          iconRight={<ChevronRight size={18} color="#FFFFFF" />}
          size="lg"
        />

        <Text style={styles.footerNote}>
          BeBrilliant · Enterprise Edition v1.0
        </Text>
      </View>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 28,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    marginBottom: 8,
  },
  logoWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#004B93',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,75,147,0.08)',
  },
  logo: {
    width: 156,
    height: 46,
  },
  skipBtn: {
    borderRadius: 99,
    backgroundColor: 'rgba(0,75,147,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,75,147,0.15)',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004B93',
    letterSpacing: 0.3,
  },

  // Slide area
  slideArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    gap: 0,
  },
  badge: {
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  iconWrap: {
    marginBottom: 28,
  },
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    color: '#0F172A',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  desc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 4,
  },

  // Feature pills
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 99,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FAFAFA',
    gap: 6,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Bottom controls
  bottom: {
    zIndex: 10,
    gap: 14,
    paddingBottom: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 9,
    borderRadius: 5,
  },
  dotActive: {
    width: 28,
  },
  dotInactive: {
    width: 9,
    backgroundColor: '#CBD5E1',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '500',
    letterSpacing: 1,
    marginTop: 2,
  },
})
