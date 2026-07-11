import React from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useIdentity } from '../../contexts/IdentityContext'
import { LogOut, Wallet, User, ChevronRight, Award, DollarSign } from 'lucide-react-native'

export default function TeacherProfile() {
  const { user, logout } = useIdentity()

  const mockTransactions = [
    { id: '1', title: 'Referral Commission - Student Anita Roy', amount: '+₹250.00', date: 'Jul 10, 2026', type: 'credit' },
    { id: '2', title: 'Referral Commission - Student Rajesh Sen', amount: '+₹300.00', date: 'Jul 08, 2026', type: 'credit' },
    { id: '3', title: 'Payout Withdrawal Request Settled', amount: '-₹1,000.00', date: 'Jun 28, 2026', type: 'debit' },
  ]

  return (
    <ScrollView className="flex-1 bg-bg-card2">
      {/* Top Banner Profile */}
      <View className="items-center bg-white border-b border-border py-8 px-5">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary mb-4 shadow-md">
          <Text className="text-3xl font-black text-white">
            {user?.fullName?.charAt(0) || 'T'}
          </Text>
        </View>
        <Text className="text-2xl font-black text-text-primary">{user?.fullName}</Text>
        <Text className="text-sm text-text-secondary mt-1">{user?.email}</Text>
        <View className="mt-4 rounded-full bg-violet-100 px-4 py-1.5 border border-violet-200">
          <Text className="text-xs font-bold text-violet-700 uppercase tracking-wider">{user?.role}</Text>
        </View>
      </View>

      {/* Wallet Section */}
      <View className="p-5">
        <View className="rounded-3xl bg-white border border-border p-6 shadow-sm mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Wallet size={18} color="#004B93" />
              <Text className="text-sm font-black text-text-primary ml-2">Commission Wallet</Text>
            </View>
            <Text className="text-xs text-text-secondary font-semibold">Affiliate referrals</Text>
          </View>

          <View className="bg-primary/5 rounded-2xl p-4 flex-row justify-between items-center border border-primary/10">
            <View>
              <Text className="text-xs text-text-secondary font-medium">Available Balance</Text>
              <Text className="text-2xl font-black text-primary mt-1">₹2,450.00</Text>
            </View>
            <TouchableOpacity className="bg-primary px-4 py-2.5 rounded-xl shadow-sm active:opacity-95">
              <Text className="text-white font-bold text-xs">Request Payout</Text>
            </TouchableOpacity>
          </View>

          {/* Transactions list */}
          <Text className="text-xs font-bold text-text-secondary uppercase mt-6 mb-3">Recent Transactions</Text>
          <View className="space-y-3">
            {mockTransactions.map((tx) => (
              <View key={tx.id} className="flex-row justify-between items-center py-2.5 border-b border-border last:border-b-0 mt-2">
                <View className="flex-1 pr-4">
                  <Text className="text-xs font-bold text-text-primary" numberOfLines={1}>
                    {tx.title}
                  </Text>
                  <Text className="text-[10px] text-text-muted mt-0.5">{tx.date}</Text>
                </View>
                <Text className={`text-xs font-black ${
                  tx.type === 'credit' ? 'text-emerald-600' : 'text-text-primary'
                }`}>
                  {tx.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* System Settings list */}
        <View className="rounded-3xl bg-white border border-border p-4 shadow-sm mb-6">
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-border">
            <View className="flex-row items-center">
              <User size={16} color="#4B5563" />
              <Text className="text-sm font-bold text-text-primary ml-3">Edit Personal Details</Text>
            </View>
            <ChevronRight size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center py-3">
            <View className="flex-row items-center">
              <Award size={16} color="#4B5563" />
              <Text className="text-sm font-bold text-text-primary ml-3">Assigned Cohorts & Subjects</Text>
            </View>
            <ChevronRight size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={logout}
          className="rounded-2xl border border-red-200 bg-red-50 py-4 items-center justify-center flex-row active:opacity-90 mb-10"
        >
          <LogOut size={18} color="#EF4444" />
          <Text className="text-base font-bold text-red-600 ml-2">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
