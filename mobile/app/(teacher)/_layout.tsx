import React from 'react'
import { Tabs } from 'expo-router'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart2,
  UserCircle,
  Video,
  FolderOpen,
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

// ─── Design Tokens ────────────────────────────────────────────────────────────
const ACCENT = '#7C3AED'   // teacher violet

// ─── Tab Icon with animated pill ────────────────────────────────────────────
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
    top: -6, left: -12, right: -12, bottom: -4,
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

// ─── Layout ──────────────────────────────────────────────────────────────────
export default function TeacherLayout() {
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
            <TabIcon icon={LayoutDashboard} label="Home" color={color as string} focused={focused} accentColor={ACCENT} />
          ),
        }}
      />

      {/* ── EXAMS ── */}
      <Tabs.Screen
        name="exams/index"
        options={{
          title: 'Exams',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={BookOpen} label="Exams" color={color as string} focused={focused} accentColor="#004B93" />
          ),
        }}
      />

      {/* ── STUDENTS ── */}
      <Tabs.Screen
        name="students/index"
        options={{
          title: 'Students',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Users} label="Students" color={color as string} focused={focused} accentColor="#059669" />
          ),
        }}
      />

      {/* ── ANALYTICS ── */}
      <Tabs.Screen
        name="analytics/index"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={BarChart2} label="Analytics" color={color as string} focused={focused} accentColor="#F59E0B" />
          ),
        }}
      />

      {/* ── PROFILE ── */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={UserCircle} label="Profile" color={color as string} focused={focused} accentColor="#EF4444" />
          ),
        }}
      />

      {/* ── HIDDEN — push-navigated ── */}
      <Tabs.Screen name="materials/index"    options={{ href: null }} />
      <Tabs.Screen name="live/index"         options={{ href: null }} />
      <Tabs.Screen name="exams/create"       options={{ href: null }} />
      <Tabs.Screen name="exams/ai-generator" options={{ href: null }} />
      <Tabs.Screen name="exams/[id]"         options={{ href: null }} />
      <Tabs.Screen name="students/[id]"      options={{ href: null }} />
    </Tabs>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 84 : 72,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 6,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF2F8',
    shadowColor: '#7C3AED',
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
