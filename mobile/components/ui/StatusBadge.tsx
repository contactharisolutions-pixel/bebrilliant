import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { C } from '../../lib/theme'

interface StatusBadgeProps {
  status: string
  label?: string
  isLive?: boolean
}

/**
 * StatusBadge — Official BeBrilliant semantic color system
 *
 * Correct/Pass/Present → #16A34A (success green)
 * Wrong/Fail/Absent    → #DC2626 (error red)
 * Pending/Late         → #F59E0B (warning orange)
 * Live                 → #DC2626 (live = urgent/active)
 * Selected (exam)      → #2563EB (interactive blue)
 */
export function StatusBadge({ status, label, isLive = false }: StatusBadgeProps) {
  const pulseOpacity = useSharedValue(0.4)

  useEffect(() => {
    if (isLive || status.toLowerCase() === 'live') {
      pulseOpacity.value = withRepeat(
        withTiming(1, { duration: 800 }),
        -1,
        true
      )
    }
  }, [isLive, status])

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }))

  const s = status.toLowerCase()

  // ── Resolve semantic color ──────────────────────────────────────────────
  let bgColor   = '#F3F4F6'
  let textColor = C.textSecondary
  let dotColor  = C.textMuted
  let borderColor = '#E5E7EB'

  if (s === 'present' || s === 'active' || s === 'pass' || s === 'distinction' || s === 'excellence') {
    // Official Success: #16A34A
    bgColor     = C.successBg          // #DCFCE7
    textColor   = C.success            // #16A34A
    dotColor    = C.success
    borderColor = '#86EFAC'
  } else if (s === 'live') {
    // Live = error red (urgent/attention)
    bgColor     = C.errorBg            // #FEE2E2
    textColor   = C.error              // #DC2626
    dotColor    = C.error
    borderColor = '#FECACA'
  } else if (s === 'absent' || s === 'inactive' || s === 'fail' || s === 'wrong') {
    // Official Error: #DC2626
    bgColor     = C.errorBg            // #FEE2E2
    textColor   = C.error              // #DC2626
    dotColor    = C.error
    borderColor = '#FECACA'
  } else if (s === 'pending' || s === 'late' || s === 'warning') {
    // Official Warning: #F59E0B
    bgColor     = C.warningBg          // #FEF3C7
    textColor   = C.warningDark        // #D97706
    dotColor    = C.warning
    borderColor = '#FDE68A'
  } else if (s === 'merit' || s === 'good' || s === 'selected') {
    // Interactive blue
    bgColor     = C.primaryBlueLight   // #EFF6FF
    textColor   = C.primaryBlueMid     // #2563EB
    dotColor    = C.primaryBlueMid
    borderColor = '#BFDBFE'
  } else if (s === 'guardian') {
    // Parent/Guardian status
    bgColor     = C.brandGreenLight    // #DCFCE7
    textColor   = C.brandGreen         // #0CA35C
    dotColor    = C.brandGreen
    borderColor = '#86EFAC'
  }

  const displayText = label || status.charAt(0).toUpperCase() + status.slice(1)
  const showDot = isLive || s === 'live' || s === 'present' || s === 'active'

  return (
    <View style={[
      styles.badge,
      { backgroundColor: bgColor, borderColor },
    ]}>
      {showDot && (
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: dotColor },
            pulseStyle,
          ]}
        />
      )}
      <Text style={[styles.label, { color: textColor }]}>
        {displayText}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:   'row',
    alignItems:      'center',
    borderRadius:    999,
    borderWidth:     1,
    paddingHorizontal: 10,
    paddingVertical:   3,
  },
  dot: {
    width:         6,
    height:        6,
    borderRadius:  3,
    marginRight:   5,
  },
  label: {
    fontSize:      10,
    fontWeight:    '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})
