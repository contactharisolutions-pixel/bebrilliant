import React, { useEffect } from 'react'
import { Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { C, SHADOW, RADIUS } from '../../lib/theme'

interface AnimatedCardProps {
  children: React.ReactNode
  onPress?: () => void
  delay?: number
  className?: string
  style?: StyleProp<ViewStyle>
  activeScale?: number
  variant?: 'default' | 'ai' | 'success' | 'error' | 'brand'
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/**
 * AnimatedCard — Official BeBrilliant card style
 *
 * Official rules:
 * - White background (#FFFFFF)
 * - Soft shadow (shadow-sm)
 * - Subtle border (#E5E7EB)
 * - Card-based layout system
 */
export function AnimatedCard({
  children,
  onPress,
  delay = 0,
  className = '',
  style,
  activeScale = 0.97,
  variant = 'default',
}: AnimatedCardProps) {
  const opacity    = useSharedValue(0)
  const translateY = useSharedValue(12)
  const scale      = useSharedValue(1)

  useEffect(() => {
    opacity.value    = withDelay(delay, withTiming(1, { duration: 350 }))
    translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 120 }))
  }, [delay])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(activeScale, { damping: 12, stiffness: 300 })
  }

  const handlePressOut = () => {
    if (onPress) scale.value = withSpring(1, { damping: 12, stiffness: 300 })
  }

  // ── Variant styles ────────────────────────────────────────────────────
  const variantStyle = {
    default: { backgroundColor: C.bgCard,    borderColor: C.border, ...SHADOW.card },
    ai:      { backgroundColor: C.aiBg,      borderColor: C.aiBorder },
    success: { backgroundColor: C.successBg, borderColor: '#86EFAC' },
    error:   { backgroundColor: C.errorBg,   borderColor: '#FECACA' },
    brand:   { backgroundColor: C.bgCard,    borderColor: C.primaryBlueMid + '40' },
  }[variant]

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        variantStyle,
        animatedStyle,
        style,
      ]}
    >
      {children}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius:  RADIUS.lg,    // 20px — official card border radius
    borderWidth:   1,
    padding:       16,
    backgroundColor: C.bgCard,
    borderColor:   C.border,
    ...SHADOW.card,
  },
})
