import React, { useState, useEffect, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, FlatList, Modal, StyleSheet,
} from 'react-native'
import {
  CreditCard, Calendar, FileText, CheckCircle2, AlertCircle, X,
  DollarSign, ArrowUpRight, ShieldCheck,
} from 'lucide-react-native'
import { useParentChildren } from '../../../hooks/useParentChildren'
import { apiFetch } from '../../../lib/api'
import { ParentHeader } from '../../../components/parent/ParentHeader'
import { C, SHADOW, RADIUS } from '../../../lib/theme'

interface Invoice {
  id: string
  type: string
  amount: number
  status: 'pending' | 'success' | 'failed' | 'refunded' | string
  razorpay_payment_id?: string
  created_at: string
}

type FilterTab = 'all' | 'paid' | 'pending'

export default function ParentFees() {
  const { data: children, isLoading: childrenLoading } = useParentChildren()
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [filter, setFilter] = useState<FilterTab>('all')

  useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id)
    }
  }, [children])

  const activeChild = children?.find(c => c.id === selectedChildId)
  const activeChildName = activeChild ? `${activeChild.first_name} ${activeChild.last_name || ''}` : 'Child'

  const fetchInvoices = async (childId: string) => {
    setLoadingInvoices(true)
    try {
      const data = await apiFetch(`/api/parent/child-payments?childId=${childId}`)
      setInvoices(data || [])
    } catch {
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

  const totalPaid = invoices
    .filter(i => i.status === 'success')
    .reduce((s, i) => s + (i.amount || 0), 0)

  const pendingBalance = invoices
    .filter(i => i.status === 'pending')
    .reduce((s, i) => s + (i.amount || 0), 0)

  const filteredInvoices = useMemo(() => {
    if (filter === 'paid') return invoices.filter(i => i.status === 'success')
    if (filter === 'pending') return invoices.filter(i => i.status === 'pending')
    return invoices
  }, [invoices, filter])

  if (childrenLoading) {
    return (
      <View style={s.container}>
        <ParentHeader showSearch={false} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={s.loadingText}>Opening Fee Ledger…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <ParentHeader activeChildName={activeChildName} />

      {/* Student Selector Bar */}
      <View style={s.selectorBar}>
        <Text style={s.selectorTitle}>SELECT STUDENT FOR FEE LEDGER</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {children?.map(child => {
            const isSelected = child.id === selectedChildId
            return (
              <TouchableOpacity
                key={child.id}
                onPress={() => setSelectedChildId(child.id)}
                style={[s.studentChip, isSelected && s.studentChipActive]}
              >
                <Text style={[s.studentChipText, isSelected && { color: '#FFFFFF' }]}>
                  {child.first_name} {child.last_name || ''}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Fee KPI Summary Bar */}
      <View style={s.kpiRow}>
        <View style={[s.kpiCard, { backgroundColor: '#ECFDF5' }]}>
          <CheckCircle2 size={16} color="#059669" />
          <Text style={[s.kpiVal, { color: '#059669' }]}>₹{totalPaid.toLocaleString('en-IN')}</Text>
          <Text style={s.kpiLbl}>Total Paid</Text>
        </View>
        <View style={[s.kpiCard, { backgroundColor: '#FFFBEB' }]}>
          <AlertCircle size={16} color="#D97706" />
          <Text style={[s.kpiVal, { color: '#D97706' }]}>₹{pendingBalance.toLocaleString('en-IN')}</Text>
          <Text style={s.kpiLbl}>Pending Balance</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={s.tabRow}>
        {[
          { key: 'all', label: `All (${invoices.length})` },
          { key: 'paid', label: 'Paid' },
          { key: 'pending', label: 'Pending' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, filter === t.key && s.tabActive]}
            onPress={() => setFilter(t.key as any)}
          >
            <Text style={[s.tabText, filter === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loadingInvoices ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={s.loadingText}>Fetching Invoices…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <CreditCard size={44} color="#CBD5E1" />
              <Text style={s.emptyTitle}>No fee invoices recorded</Text>
              <Text style={s.emptySub}>All student billing records are settled</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isPaid = item.status === 'success'
            return (
              <TouchableOpacity
                onPress={() => setSelectedInvoice(item)}
                style={s.invoiceCard}
                activeOpacity={0.85}
              >
                <View style={s.invoiceIconBox}>
                  <CreditCard size={20} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.invoiceType} numberOfLines={1}>
                    {item.type || 'Institutional Fee Payment'}
                  </Text>
                  <Text style={s.invoiceDate}>
                    Date: {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.invoiceAmount}>₹{item.amount.toFixed(0)}</Text>
                  <View style={[s.statusBadge, isPaid ? s.statusPaid : s.statusPending]}>
                    {isPaid ? <CheckCircle2 size={10} color="#059669" /> : <AlertCircle size={10} color="#D97706" />}
                    <Text style={[s.statusBadgeText, { color: isPaid ? '#059669' : '#D97706' }]}>
                      {isPaid ? 'PAID' : item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}

      {/* Invoice Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!selectedInvoice}
        onRequestClose={() => setSelectedInvoice(null)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Fee Invoice Detail</Text>
              <TouchableOpacity onPress={() => setSelectedInvoice(null)} style={s.modalClose}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedInvoice && (
              <View style={s.detailCard}>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Invoice Reference</Text>
                  <Text style={s.detailValue} numberOfLines={1}>{selectedInvoice.id}</Text>
                </View>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Billing Type</Text>
                  <Text style={s.detailValue}>{selectedInvoice.type || 'Fee Payment'}</Text>
                </View>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Total Amount</Text>
                  <Text style={[s.detailValue, { color: C.warningDark, fontWeight: '900' }]}>
                    ₹{selectedInvoice.amount.toFixed(2)}
                  </Text>
                </View>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Payment Date</Text>
                  <Text style={s.detailValue}>
                    {new Date(selectedInvoice.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Razorpay Payment ID</Text>
                  <Text style={s.detailValue} numberOfLines={1}>
                    {selectedInvoice.razorpay_payment_id || 'N/A'}
                  </Text>
                </View>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Payment Status</Text>
                  <Text style={[s.detailValue, { color: selectedInvoice.status === 'success' ? C.brandGreen : C.warningDark, fontWeight: '900' }]}>
                    {selectedInvoice.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={s.closeBtn} onPress={() => setSelectedInvoice(null)}>
              <Text style={s.closeBtnText}>Close Ledger</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgAlt },          // official: #F7F8FA
  loadingText: { marginTop: 12, fontSize: 13, color: C.textSecondary, fontWeight: '600' },

  selectorBar: { backgroundColor: C.bgCard, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  selectorTitle: { fontSize: 9, fontWeight: '900', color: C.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  studentChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: C.bgAlt, borderWidth: 1, borderColor: C.border },
  studentChipActive: { backgroundColor: C.primaryBlueMid, borderColor: C.primaryBlueMid },
  studentChipText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },

  kpiRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  kpiCard: { flex: 1, borderRadius: RADIUS.md, padding: 14, gap: 4, borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  kpiVal: { fontSize: 20, fontWeight: '900' },
  kpiLbl: { fontSize: 9, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },

  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  tabActive: { backgroundColor: C.primaryBlueMid, borderColor: C.primaryBlueMid },
  tabText: { fontSize: 11, fontWeight: '700', color: C.textSecondary },
  tabTextActive: { color: '#FFFFFF', fontWeight: '900' },

  listContent: { padding: 16, paddingBottom: 36 },
  invoiceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, ...SHADOW.card },
  invoiceIconBox: { width: 42, height: 42, borderRadius: RADIUS.sm, backgroundColor: C.warningBg, alignItems: 'center', justifyContent: 'center' },
  invoiceType: { fontSize: 14, fontWeight: '800', color: C.textPrimary },
  invoiceDate: { fontSize: 10, color: C.textMuted, fontWeight: '500', marginTop: 2 },
  invoiceAmount: { fontSize: 16, fontWeight: '900', color: C.textPrimary },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  statusPaid: { backgroundColor: C.successBg },         // official: #DCFCE7
  statusPending: { backgroundColor: C.warningBg },      // official: #FEF3C7
  statusBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: C.textSecondary, marginTop: 16 },
  emptySub: { fontSize: 12, color: C.textMuted, fontWeight: '500', marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalBox: { backgroundColor: C.bgCard, borderRadius: RADIUS.xl, padding: 24, width: '100%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bgAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  detailCard: { backgroundColor: C.bgAlt, borderRadius: RADIUS.md, padding: 16, gap: 12, borderWidth: 1, borderColor: C.border },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  detailValue: { fontSize: 12, fontWeight: '800', color: C.textPrimary, maxWidth: '60%' },
  closeBtn: { backgroundColor: C.primaryBlueMid, borderRadius: RADIUS.sm, paddingVertical: 14, alignItems: 'center', marginTop: 20, ...SHADOW.md },
  closeBtnText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
})
