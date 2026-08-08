import React from 'react'
import { Text, ActivityIndicator, Pressable, View, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { C, GRADIENT, RADIUS, SHADOW } from '../../lib/theme'

interface PrimaryButtonProps {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'success' | 'outline' | 'ghost' | 'danger' | 'ai'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth = true,
}: PrimaryButtonProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 350 })
    }
  }

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 15, stiffness: 350 })
    }
  }

  // ── Size configs ────────────────────────────────────────────────────────
  const sizeConfig = {
    sm: { paddingVertical: 10, paddingHorizontal: 18, fontSize: 12, height: 40 },
    md: { paddingVertical: 14, paddingHorizontal: 22, fontSize: 14, height: 50 },
    lg: { paddingVertical: 18, paddingHorizontal: 28, fontSize: 16, height: 58 },
  }[size]

  // ── Gradient primary button ─────────────────────────────────────────────
  if (variant === 'primary') {
    return (
      <Animated.View
        style={[
          animatedStyle,
          { borderRadius: RADIUS.lg, overflow: 'hidden', ...(fullWidth ? { width: '100%' } : {}) },
          SHADOW.brand,
          disabled && { opacity: 0.5 },
        ]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={{ borderRadius: RADIUS.lg, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={[...GRADIENT.colors]}
            start={GRADIENT.start}
            end={GRADIENT.end}
            style={[
              s.inner,
              { paddingVertical: sizeConfig.paddingVertical, paddingHorizontal: sizeConfig.paddingHorizontal, height: sizeConfig.height },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                {icon && <View style={s.iconLeft}>{icon}</View>}
                <Text style={[s.labelWhite, { fontSize: sizeConfig.fontSize }]}>{title}</Text>
                {iconRight && <View style={s.iconRight}>{iconRight}</View>}
              </>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    )
  }

  // ── Non-gradient variants ───────────────────────────────────────────────
  const variantMap: Record<string, {
    bgColor: string; borderColor: string; textColor: string; spinnerColor: string; shadow?: object
  }> = {
    secondary: {
      bgColor:     '#F7F8FA',
      borderColor: C.border,
      textColor:   C.textPrimary,
      spinnerColor: C.primaryBlueMid,
    },
    success: {
      bgColor:     C.success,
      borderColor: C.success,
      textColor:   '#FFFFFF',
      spinnerColor: '#FFFFFF',
      shadow:      SHADOW.success,
    },
    danger: {
      bgColor:     C.error,
      borderColor: C.error,
      textColor:   '#FFFFFF',
      spinnerColor: '#FFFFFF',
      shadow:      SHADOW.error,
    },
    outline: {
      bgColor:     'transparent',
      borderColor: C.primaryBlueMid,
      textColor:   C.primaryBlueMid,
      spinnerColor: C.primaryBlueMid,
    },
    ghost: {
      bgColor:     'transparent',
      borderColor: 'transparent',
      textColor:   C.primaryBlueMid,
      spinnerColor: C.primaryBlueMid,
    },
    ai: {
      bgColor:     C.aiBg,
      borderColor: C.aiBorder,
      textColor:   C.aiText,
      spinnerColor: C.aiText,
    },
  }

  const cfg = variantMap[variant] || variantMap.secondary

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        animatedStyle,
        s.inner,
        {
          backgroundColor: cfg.bgColor,
          borderColor:     cfg.borderColor,
          borderWidth:     1.5,
          borderRadius:    RADIUS.lg,
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          height: sizeConfig.height,
        },
        cfg.shadow,
        fullWidth && { width: '100%' },
        disabled && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={cfg.spinnerColor} size="small" />
      ) : (
        <>
          {icon && <View style={s.iconLeft}>{icon}</View>}
          <Text style={[variant === 'ghost' || variant === 'outline' || variant === 'ai' || variant === 'secondary' ? s.labelColored : s.labelWhite, { fontSize: sizeConfig.fontSize, color: cfg.textColor }]}>
            {title}
          </Text>
          {iconRight && <View style={s.iconRight}>{iconRight}</View>}
        </>
      )}
    </AnimatedPressable>
  )
}

const s = StyleSheet.create({
  inner: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  labelWhite: {
    fontWeight: '900',
    color:      '#FFFFFF',
    letterSpacing: 0.2,
  },
  labelColored: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
})
