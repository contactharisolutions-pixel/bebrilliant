import React from 'react'
import { Tabs } from 'expo-router'
import { LayoutDashboard, BookOpen, Wallet, LogOut } from 'lucide-react-native'
import { useIdentity } from '../../contexts/IdentityContext'
import { TouchableOpacity, View, Text } from 'react-native'

export default function StudentLayout() {
  const { logout, user } = useIdentity()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#004B93',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopColor: '#F1F5F9',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
        },
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 18,
          color: '#111827',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          headerTitle: 'Student Hub',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="exams/index"
        options={{
          title: 'Exams',
          tabBarLabel: 'Exams',
          headerTitle: 'Exam Center',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet/index"
        options={{
          title: 'Wallet',
          tabBarLabel: 'Wallet',
          headerTitle: 'My Wallet',
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          headerTitle: 'My Account',
          tabBarIcon: ({ color, size }) => (
            <View className="h-6 w-6 items-center justify-center rounded-full bg-primary/10">
              <Text className="text-xs font-bold text-primary">
                {user?.fullName?.charAt(0) || 'S'}
              </Text>
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={logout} className="mr-4 p-2">
              <LogOut size={20} color="#EF4444" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="materials/index"
        options={{
          href: null,
          title: 'Study Materials',
          headerTitle: 'Study Vault',
        }}
      />
      <Tabs.Screen
        name="live/index"
        options={{
          href: null,
          title: 'Live Classroom',
          headerTitle: 'Live Classes',
        }}
      />
    </Tabs>
  )
}
