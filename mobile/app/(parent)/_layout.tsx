import React from 'react'
import { Tabs } from 'expo-router'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  UserCircle,
} from 'lucide-react-native'
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'

const ACCENT = '#059669' // parent emerald theme

interface TabIconProps {
  icon: React.ComponentType<{ size: number; color: string }>
  label: string
  color: string
  focused: boolean
  accentColor?: string
}

function TabIcon({ icon: Icon, label, color, focused, accentColor = ACCENT }: TabIconProps) {
  const opacity = useSharedValue(focused ? 1 : 0)
  const scale   = useSharedValue(focused ? 1 : 0.7)

  React.useEffect(() => {
    opacity.value = withTiming(focused ? 1 : 0, { duration: 220, easing: Easing.out(Easing.quad) })
    scale.value   = withTiming(focused ? 1 : 0.7, { duration: 220, easing: Easing.out(Easing.back(1.8)) })
  }, [focused])

  const pillStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleX: scale.value }, { scaleY: scale.value }],
    backgroundColor: accentColor + '18',
    position: 'absolute',
    top: -6, left: -14, right: -14, bottom: -4,
    borderRadius: 18,
  }))

  return (
    <View style={styles.tabItem}>
      <Animated.View style={pillStyle} />
      <Icon size={focused ? 22 : 20} color={focused ? accentColor : color} />
      <Text style={[styles.tabLabel, { color: focused ? accentColor : color, fontWeight: focused ? '800' : '600' }]}>
        {label}
      </Text>
    </View>
  )
}

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      {/* ── HOME / DASHBOARD ── */}
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={LayoutDashboard} label="Home" color={color} focused={focused} accentColor={ACCENT} />
          ),
        }}
      />

      {/* ── CHILDREN ── */}
      <Tabs.Screen
        name="children/index"
        options={{
          title: 'Children',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Users} label="Children" color={color} focused={focused} accentColor="#004B93" />
          ),
        }}
      />

      {/* ── FEES ── */}
      <Tabs.Screen
        name="fees/index"
        options={{
          title: 'Fees',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={CreditCard} label="Fees" color={color} focused={focused} accentColor="#D97706" />
          ),
        }}
      />

      {/* ── PROFILE ── */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={UserCircle} label="Profile" color={color} focused={focused} accentColor="#EF4444" />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 84 : 72,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 6,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF2F8',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 4,
    gap: 3,
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: 0.2,
    marginTop: 1,
  },
})
