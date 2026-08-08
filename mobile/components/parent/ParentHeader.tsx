import React from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, Platform, StatusBar,
} from 'react-native'
import { Bell, Users, ChevronDown } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useIdentity } from '../../contexts/IdentityContext'
import { C, GRADIENT, SHADOW, RADIUS } from '../../lib/theme'

interface ParentHeaderProps {
  activeChildName?: string
  onSwitchChildPress?: () => void
  showSearch?: boolean
}

export function ParentHeader({
  activeChildName,
  onSwitchChildPress,
}: ParentHeaderProps) {
  const { user } = useIdentity()
  const initial = user?.fullName?.charAt(0).toUpperCase() || 'P'

  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        {/* Brand — gradient logo matching brand system */}
        <View style={styles.brand}>
          <LinearGradient
            colors={[...GRADIENT.colors]}
            start={GRADIENT.start}
            end={GRADIENT.end}
            style={styles.logoSquare}
          >
            <Text style={styles.logoText}>Be</Text>
          </LinearGradient>
          <View>
            <Text style={styles.brandName}>BeBrilliant</Text>
            <Text style={styles.brandSub}>Parent Portal</Text>
          </View>
        </View>

        {/* Right side controls */}
        <View style={styles.rightRow}>
          {/* Child Switcher Pill */}
          {activeChildName && (
            <TouchableOpacity
              style={styles.childPill}
              onPress={onSwitchChildPress}
              activeOpacity={0.8}
            >
              <Users size={13} color={C.brandGreen} />
              <Text style={styles.childPillText} numberOfLines={1}>{activeChildName}</Text>
              <ChevronDown size={12} color={C.brandGreen} />
            </TouchableOpacity>
          )}

          {/* Bell */}
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.75}>
            <Bell size={18} color={C.textSecondary} />
            <View style={styles.bellDot} />
          </TouchableOpacity>

          {/* Avatar — brand gradient */}
          <LinearGradient
            colors={[...GRADIENT.colors]}
            start={GRADIENT.start}
            end={GRADIENT.end}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  )
}

const PT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 28) : 52

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor:   C.bgCard,           // #FFFFFF
    paddingTop:        PT,
    paddingHorizontal: 16,
    paddingBottom:     12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,           // official: #E5E7EB
    ...SHADOW.card,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoSquare: {
    width:          36,
    height:         36,
    borderRadius:   RADIUS.sm,             // 12px
    alignItems:     'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  brandName: {
    fontSize:    16,
    fontWeight:  '900',
    color:       C.textPrimary,
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize:      9,
    fontWeight:    '700',
    color:         C.brandGreen,           // official brand green #0CA35C
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  childPill: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              5,
    backgroundColor:  C.brandGreenLight,   // #DCFCE7
    borderWidth:      1,
    borderColor:      '#86EFAC',
    borderRadius:     RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical:   5,
    maxWidth:         130,
  },
  childPillText: {
    fontSize:   11,
    fontWeight: '800',
    color:      C.brandGreen,             // #0CA35C
  },

  bellBtn: {
    width:          36,
    height:         36,
    borderRadius:   RADIUS.sm,
    backgroundColor: '#F7F8FA',
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
    borderColor:    C.border,
    position:       'relative',
  },
  bellDot: {
    position:      'absolute',
    top:           7,
    right:         7,
    width:         6,
    height:        6,
    borderRadius:  3,
    backgroundColor: C.error,             // official: #DC2626
    borderWidth:   1,
    borderColor:   '#FFFFFF',
  },
  avatar: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
})
