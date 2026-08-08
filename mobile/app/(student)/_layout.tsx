import React from 'react'
import { Tabs } from 'expo-router'
import {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  Wallet,
  UserCircle,
} from 'lucide-react-native'
import { useIdentity } from '../../contexts/IdentityContext'
import { View, Text, StyleSheet, Platform } from 'react-native'

// ─── Animated active tab indicator ──────────────────────────────────────────
function TabIcon({
  icon: Icon,
  label,
  color,
  focused,
  accentColor,
}: {
  icon: React.ComponentType<{ size: number; color: string }>
  label: string
  color: string
  focused: boolean
  accentColor: string
}) {
  return (
    <View style={styles.tabItem}>
      {focused && <View style={[styles.activePill, { backgroundColor: accentColor + '22' }]} />}
      <Icon size={focused ? 22 : 20} color={focused ? accentColor : color} />
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? accentColor : color, fontWeight: focused ? '800' : '600' },
        ]}
      >
        {label}
      </Text>
    </View>
  )
}

export default function StudentLayout() {
  const { user } = useIdentity()
  const userInitial = user?.fullName?.charAt(0).toUpperCase() || 'S'

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Each screen renders its own custom header
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false, // Labels are rendered inside TabIcon
      }}
    >
      {/* ── HOME ── */}
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={LayoutDashboard}
              label="Home"
              color={color as string}
              focused={focused}
              accentColor="#004B93"
            />
          ),
        }}
      />

      {/* ── EXAMS ── */}
      <Tabs.Screen
        name="exams/index"
        options={{
          title: 'Exams',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={BookOpen}
              label="Exams"
              color={color as string}
              focused={focused}
              accentColor="#7C3AED"
            />
          ),
        }}
      />

      {/* ── ANALYTICS ── */}
      <Tabs.Screen
        name="analytics/index"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={BarChart2}
              label="Analytics"
              color={color as string}
              focused={focused}
              accentColor="#059669"
            />
          ),
        }}
      />

      {/* ── WALLET ── */}
      <Tabs.Screen
        name="wallet/index"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={Wallet}
              label="Wallet"
              color={color as string}
              focused={focused}
              accentColor="#F59E0B"
            />
          ),
        }}
      />

      {/* ── PROFILE ── */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={UserCircle}
              label="Profile"
              color={color as string}
              focused={focused}
              accentColor="#EF4444"
            />
          ),
        }}
      />

      {/* Hidden screens (navigated to via router.push) */}
      <Tabs.Screen name="materials/index" options={{ href: null }} />
      <Tabs.Screen name="live/index"      options={{ href: null }} />
      <Tabs.Screen name="exams/attempt"   options={{ href: null }} />
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
    shadowColor: '#0040A0',
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
  activePill: {
    position: 'absolute',
    top: -6,
    borderRadius: 99,
    width: 40,
    height: 40,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
    marginTop: 1,
  },
})
