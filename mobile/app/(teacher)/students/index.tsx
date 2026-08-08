import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet, TextInput, Modal, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Users, Plus, X, ChevronRight, UserCircle, TrendingUp, CheckCircle } from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'
import { TeacherHeader } from '../../../components/teacher/TeacherHeader'

interface Student {
  id: string; first_name: string; last_name: string
  email: string; class_name?: string; avg_score?: number; status?: string
}

export default function TeacherStudents() {
  const router = useRouter()
  const [students, setStudents]     = useState<Student[]>([])
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [showModal, setShowModal]   = useState(false)

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    phone: '', class_name: 'Standard 10', password: '',
  })

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/dashboard/students')
      setStudents(data?.students || data || [])
    } catch { }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const filtered = useMemo(() =>
    students.filter(s => {
      const q = search.toLowerCase()
      return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    }), [students, search])

  const handleAdd = async () => {
    if (!form.first_name || !form.email || !form.password)
      return Alert.alert('Required', 'First name, email, and password are required.')
    setSaving(true)
    try {
      await apiFetch('/api/dashboard/students', {
        method: 'POST',
        body: JSON.stringify({ action: 'ADD_STUDENT', payload: form }),
      })
      setShowModal(false)
      setForm({ first_name: '', last_name: '', email: '', phone: '', class_name: 'Standard 10', password: '' })
      fetchStudents()
      Alert.alert('✅ Added', 'Student added successfully.')
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add student.')
    } finally { setSaving(false) }
  }

  if (loading) {
    return (
      <View style={s.container}>
        <TeacherHeader showSearch={false} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={s.loadingText}>Loading Roster…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <TeacherHeader onSearch={setSearch} searchPlaceholder="Search students…" />

      {/* Subheader */}
      <View style={s.subHeader}>
        <Users size={16} color="#059669" />
        <Text style={s.subTitle}>Student Roster</Text>
        <View style={s.countBadge}>
          <Text style={s.countText}>{filtered.length}</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={s => s.id}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Users size={44} color="#CBD5E1" />
            <Text style={s.emptyTitle}>{search ? 'No students found' : 'No students yet'}</Text>
            <Text style={s.emptySub}>Tap + to add your first student</Text>
          </View>
        }
        renderItem={({ item: st }) => {
          const initials = `${st.first_name.charAt(0)}${(st.last_name || '').charAt(0)}`.toUpperCase()
          const avg = st.avg_score ?? 0
          const scoreColor = avg >= 80 ? '#059669' : avg >= 60 ? '#F59E0B' : '#EF4444'
          return (
            <TouchableOpacity
              style={s.studentCard}
              onPress={() => router.push(`/(teacher)/students/${st.id}` as any)}
              activeOpacity={0.85}
            >
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials || '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.studentName}>{st.first_name} {st.last_name}</Text>
                <Text style={s.studentEmail} numberOfLines={1}>{st.email}</Text>
                {st.class_name && <Text style={s.studentClass}>{st.class_name}</Text>}
                {avg > 0 && (
                  <View style={s.scoreBar}>
                    <View style={[s.scoreBarFill, { width: `${avg}%`, backgroundColor: scoreColor }]} />
                  </View>
                )}
              </View>
              <View style={s.rightCol}>
                {avg > 0 && <Text style={[s.avgScore, { color: scoreColor }]}>{avg}%</Text>}
                <ChevronRight size={16} color="#CBD5E1" />
              </View>
            </TouchableOpacity>
          )
        }}
      />

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setShowModal(true)} activeOpacity={0.85}>
        <Plus size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Student Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add Student</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} style={s.modalCloseBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            {[
              { label: 'First Name *', key: 'first_name', placeholder: 'Aarav' },
              { label: 'Last Name', key: 'last_name', placeholder: 'Sharma' },
              { label: 'Email *', key: 'email', placeholder: 'aarav@school.in', keyType: 'email-address' },
              { label: 'Phone', key: 'phone', placeholder: '+91 98765 43210', keyType: 'phone-pad' },
              { label: 'Password *', key: 'password', placeholder: '••••••••', secure: true },
            ].map(f => (
              <View key={f.key} style={s.formField}>
                <Text style={s.formLabel}>{f.label}</Text>
                <TextInput
                  value={(form as any)[f.key]}
                  onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                  placeholder={f.placeholder}
                  placeholderTextColor="#94A3B8"
                  keyboardType={(f as any).keyType || 'default'}
                  secureTextEntry={(f as any).secure}
                  style={s.formInput}
                />
              </View>
            ))}

            <View style={s.formField}>
              <Text style={s.formLabel}>Class / Grade</Text>
              <View style={s.classGrid}>
                {['Standard 9', 'Standard 10', 'Standard 11', 'Standard 12'].map(cls => (
                  <TouchableOpacity
                    key={cls}
                    style={[s.classChip, form.class_name === cls && s.classChipActive]}
                    onPress={() => setForm(prev => ({ ...prev, class_name: cls }))}
                  >
                    <Text style={[s.classChipText, form.class_name === cls && { color: '#059669' }]}>{cls}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={s.saveBtn} onPress={handleAdd} disabled={saving} activeOpacity={0.85}>
              {saving
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <><CheckCircle size={18} color="#FFFFFF" /><Text style={s.saveBtnText}>Add Student</Text></>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600' },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF2F8' },
  subTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', flex: 1 },
  countBadge: { backgroundColor: '#ECFDF5', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { fontSize: 12, fontWeight: '900', color: '#059669' },
  listContent: { padding: 16, paddingBottom: 96 },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E8F5EE', shadowColor: '#059669', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  studentName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  studentEmail: { fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: 2 },
  studentClass: { fontSize: 10, fontWeight: '700', color: '#059669', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreBar: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 99, marginTop: 6, overflow: 'hidden' },
  scoreBarFill: { height: 4, borderRadius: 99 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  avgScore: { fontSize: 14, fontWeight: '900' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#64748B', marginTop: 16 },
  emptySub: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 4 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center', shadowColor: '#059669', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.40, shadowRadius: 16, elevation: 10 },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEF2F8' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  formField: { marginBottom: 16 },
  formLabel: { fontSize: 12, fontWeight: '800', color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  formInput: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, fontSize: 14, fontWeight: '600', color: '#0F172A', backgroundColor: '#F8FAFC' },
  classGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  classChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  classChipActive: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  classChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#059669', borderRadius: 16, paddingVertical: 16, marginTop: 10, shadowColor: '#059669', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.30, shadowRadius: 12, elevation: 8 },
  saveBtnText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
})
