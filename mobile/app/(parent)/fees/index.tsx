import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, FlatList, Modal } from 'react-native'
import { CreditCard, ArrowLeft, Calendar, FileText, CheckCircle2, AlertCircle, X, DollarSign } from 'lucide-react-native'
import { useParentChildren } from '../../../hooks/useParentChildren'
import { apiFetch } from '../../../lib/api'

interface Invoice {
  id: string
  type: string
  amount: number
  status: 'pending' | 'success' | 'failed' | 'refunded'
  razorpay_payment_id?: string
  created_at: string
}

export default function ParentFees() {
  const { data: children, isLoading: childrenLoading } = useParentChildren()
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // Auto-select first child
  useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id)
    }
  }, [children])

  const fetchInvoices = async (childId: string) => {
    setLoadingInvoices(true)
    try {
      const data = await apiFetch(`/api/parent/child-payments?childId=${childId}`)
      setInvoices(data || [])
    } catch (e) {
      console.error(e)
      Alert.alert('Error', 'Failed to retrieve fee invoice list')
    } finally {
      setLoadingInvoices(false)
    }
  }

  useEffect(() => {
    if (selectedChildId) {
      fetchInvoices(selectedChildId)
    }
  }, [selectedChildId])

  if (childrenLoading) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center">
        <ActivityIndicator size="large" color="#004B93" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-bg-card2">
      {/* Horizontal Children selector */}
      <View className="bg-white border-b border-border py-4 px-5">
        <Text className="text-xs font-bold text-text-secondary uppercase mb-3">Select Student</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {children?.map((child) => {
            const isSelected = child.id === selectedChildId
            return (
              <TouchableOpacity
                key={child.id}
                onPress={() => setSelectedChildId(child.id)}
                className={`px-5 py-2.5 rounded-full mr-3 border ${
                  isSelected ? 'bg-primary border-primary' : 'bg-bg-card2 border-border'
                }`}
              >
                <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-text-primary'}`}>
                  {child.first_name} {child.last_name || ''}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {loadingInvoices ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#004B93" />
        </View>
      ) : (
        /* Invoices List */
        <FlatList
          data={invoices}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <CreditCard size={48} color="#9CA3AF" />
              <Text className="text-base font-bold text-text-secondary mt-4">No fee invoices recorded</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedInvoice(item)}
              className="flex-row items-center justify-between rounded-2xl bg-white border border-border p-4 shadow-sm mb-4 active:opacity-90"
            >
              <View className="flex-row items-center flex-1 pr-4">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mr-4">
                  <CreditCard size={20} color="#004B93" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-black text-text-primary uppercase" numberOfLines={1}>
                    {item.type || 'Fee Payment'}
                  </Text>
                  <Text className="text-xs text-text-muted mt-0.5">
                    Date: {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View className="items-end">
                <Text className="text-base font-black text-text-primary">
                  ₹{item.amount.toFixed(0)}
                </Text>
                <View className="flex-row items-center mt-1">
                  {item.status === 'success' ? (
                    <View className="flex-row items-center bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                      <CheckCircle2 size={10} color="#10B981" />
                      <Text className="text-[9px] text-emerald-600 font-bold ml-1 uppercase">Paid</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                      <AlertCircle size={10} color="#F59E0B" />
                      <Text className="text-[9px] text-amber-700 font-bold ml-1 uppercase">{item.status}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Invoice Detail modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!selectedInvoice}
        onRequestClose={() => setSelectedInvoice(null)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center p-6">
          <View className="w-full bg-white rounded-3xl p-6 shadow-2xl space-y-5">
            <View className="flex-row justify-between items-center pb-2 border-b border-border">
              <Text className="text-lg font-black text-text-primary">Invoice Details</Text>
              <TouchableOpacity onPress={() => setSelectedInvoice(null)} className="p-1">
                <X size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <View className="space-y-3 mt-4 bg-bg-card2 p-5 rounded-2xl border border-border">
              <View className="flex-row justify-between">
                <Text className="text-xs font-semibold text-text-muted">Invoice ID</Text>
                <Text className="text-xs font-bold text-text-primary" numberOfLines={1}>{selectedInvoice?.id}</Text>
              </View>

              <View className="flex-row justify-between mt-2">
                <Text className="text-xs font-semibold text-text-muted">Billing Type</Text>
                <Text className="text-xs font-bold text-text-primary uppercase">{selectedInvoice?.type}</Text>
              </View>

              <View className="flex-row justify-between mt-2">
                <Text className="text-xs font-semibold text-text-muted">Total Amount</Text>
                <Text className="text-sm font-black text-primary">₹{selectedInvoice?.amount.toFixed(2)}</Text>
              </View>

              <View className="flex-row justify-between mt-2">
                <Text className="text-xs font-semibold text-text-muted">Payment Date</Text>
                <Text className="text-xs font-bold text-text-primary">
                  {selectedInvoice ? new Date(selectedInvoice.created_at).toLocaleDateString() : ''}
                </Text>
              </View>

              <View className="flex-row justify-between mt-2">
                <Text className="text-xs font-semibold text-text-muted">Razorpay ID</Text>
                <Text className="text-xs font-bold text-text-primary" numberOfLines={1}>
                  {selectedInvoice?.razorpay_payment_id || 'N/A'}
                </Text>
              </View>

              <View className="flex-row justify-between mt-2">
                <Text className="text-xs font-semibold text-text-muted">Status</Text>
                <Text className={`text-xs font-black ${
                  selectedInvoice?.status === 'success' ? 'text-emerald-600' : 'text-amber-500'
                } uppercase`}>
                  {selectedInvoice?.status}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setSelectedInvoice(null)}
              className="mt-6 w-full bg-primary py-4 rounded-xl items-center shadow-lg active:opacity-95"
            >
              <Text className="text-white font-bold text-base">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}
