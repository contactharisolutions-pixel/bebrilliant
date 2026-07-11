import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native'
import { Wallet, Copy, Share2, TrendingUp, Sparkles } from 'lucide-react-native'
import { useIdentity } from '../../../contexts/IdentityContext'
import { apiFetch } from '../../../lib/api'

interface Transaction {
  id: string
  credit_type: 'free' | 'paid'
  txn_type: 'credit' | 'debit'
  amount: number
  balance_after: number
  source: string
  notes?: string
  created_at: string
}

export default function StudentWallet() {
  const { user } = useIdentity()
  const [balance, setBalance] = useState<number>(0)
  const [txns, setTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [sumData, txData] = await Promise.all([
        apiFetch('/api/student/dashboard-summary'),
        apiFetch('/api/student/wallet-transactions')
      ])
      setBalance(sumData?.credits || 0)
      setTxns(txData || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const referralUrl = `https://bebrilliant.io/signup?ref=${user?.id || 'partner'}`

  const handleShareReferral = async () => {
    try {
      await Share.share({
        message: `Join me on BeBrilliant and prepare for your exams! Sign up using my referral link to get welcome credits: ${referralUrl}`,
        title: 'BeBrilliant Referral'
      })
    } catch (error: any) {
      Alert.alert('Share Failed', error.message)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center">
        <ActivityIndicator size="large" color="#004B93" />
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-bg-card2 px-5 py-6">
      {/* Wallet Balance Card */}
      <View className="rounded-3xl bg-primary p-6 shadow-lg shadow-primary/20 border border-primary/10">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-wider text-white/70">
            Available Coins / Balance
          </Text>
          <Wallet size={16} color="rgba(255,255,255,0.7)" />
        </View>
        <Text className="text-3xl font-black text-white mt-2">
          {balance.toFixed(0)} Credits
        </Text>
        <Text className="text-[10px] text-white/60 mt-1">
          1 Credit = ₹1.00 · Applicable on premium exam carts
        </Text>
      </View>

      {/* Refer & Earn Banner */}
      <View className="mt-6 rounded-3xl bg-violet-600 p-6 shadow-md">
        <View className="flex-row items-center space-x-2">
          <Sparkles size={16} color="#FFE4E6" />
          <Text className="text-xs font-bold text-rose-100 uppercase tracking-wide">
            Affiliate Reward Partner
          </Text>
        </View>
        <Text className="text-lg font-black text-white mt-1.5">
          Refer a friend & get 100 Credits!
        </Text>
        <Text className="text-xs text-white/80 mt-1">
          Earn commission coins when they purchase any premium exam paper.
        </Text>

        <TouchableOpacity
          onPress={handleShareReferral}
          className="mt-5 flex-row items-center justify-center rounded-xl bg-white py-3 shadow-sm active:opacity-90"
        >
          <Share2 size={14} color="#7C3AED" />
          <Text className="text-violet-700 font-bold text-xs ml-2">Share Invite Link</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction History list */}
      <View className="mt-8 pb-12">
        <Text className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-4">
          Transaction Audit Logs
        </Text>

        <View className="rounded-3xl bg-white border border-border p-5 shadow-sm">
          {txns.length > 0 ? (
            txns.map((tx) => (
              <View key={tx.id} className="flex-row justify-between items-center py-3 border-b border-border last:border-b-0 mt-1">
                <View className="flex-1 pr-4">
                  <Text className="text-xs font-bold text-text-primary capitalize">
                    {tx.source.replace('_', ' ')}
                  </Text>
                  <Text className="text-[10px] text-text-muted mt-0.5">
                    {new Date(tx.created_at).toLocaleDateString()} · {tx.credit_type} coins
                  </Text>
                </View>
                <View className="items-end">
                  <Text className={`text-xs font-black ${
                    tx.txn_type === 'credit' ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {tx.txn_type === 'credit' ? '+' : '-'}{tx.amount}
                  </Text>
                  <Text className="text-[9px] text-text-muted mt-0.5">
                    bal: {tx.balance_after}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View className="items-center justify-center py-8">
              <TrendingUp size={24} color="#9CA3AF" />
              <Text className="text-xs text-text-secondary mt-2">No transaction activity</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
}
