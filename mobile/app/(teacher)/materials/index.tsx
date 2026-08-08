import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet, TextInput, Modal, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import * as WebBrowser from 'expo-web-browser'
import {
  FolderOpen, Plus, Search, Trash2, FileText, Video,
  Book, UploadCloud, CheckCircle, ExternalLink, HardDrive, X, Filter,
} from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'
import { supabase } from '../../../lib/supabase'
import { TeacherHeader } from '../../../components/teacher/TeacherHeader'

interface Material {
  id: string
  title: string
  type: 'pdf' | 'video' | 'notes' | string
  subject: string
  class_name: string
  file_url?: string
  file_size?: string
  created_at: string
}

type TabType = 'all' | 'pdf' | 'video' | 'notes'

export default function TeacherMaterials() {
  const router = useRouter()
  const [tab, setTab] = useState<TabType>('all')
  const [search, setSearch] = useState('')
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Upload state
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('General')
  const [className, setClassName] = useState('Standard 10')
  const [type, setType] = useState<'pdf' | 'video' | 'notes'>('pdf')
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null)

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch(`/api/dashboard/material?type=${tab}&search=${encodeURIComponent(search)}`)
      setMaterials(data || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [tab, search])

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      })
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSelectedFile(res.assets[0])
      }
    } catch (e: any) {
      Alert.alert('File Picker Error', e.message || 'Could not pick file')
    }
  }

  const handleUpload = async () => {
    if (!title.trim() || !selectedFile) {
      return Alert.alert('Required', 'Please enter a title and select a file to upload.')
    }
    setUploading(true)
    try {
      const ext = selectedFile.name.split('.').pop() || 'file'
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`

      // Fetch file blob for upload
      const response = await fetch(selectedFile.uri)
      const blob = await response.blob()

      const { data: sData, error: sErr } = await supabase.storage
        .from('study-materials')
        .upload(fileName, blob, { contentType: selectedFile.mimeType || 'application/octet-stream' })

      if (sErr) throw sErr

      const payload = {
        title,
        type,
        subject,
        class_name: className,
        file_url: sData.path,
        file_size: selectedFile.size ? (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB' : '1.0 MB',
      }

      await apiFetch('/api/dashboard/material', {
        method: 'POST',
        body: JSON.stringify({ action: 'CREATE_ASSET', payload }),
      })

      Alert.alert('✅ Uploaded!', 'Knowledge asset added to vault.')
      setShowModal(false)
      setTitle('')
      setSelectedFile(null)
      fetchMaterials()
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message || 'Could not upload asset.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (id: string, itemTitle: string) => {
    Alert.alert('Decommission Asset', `Remove "${itemTitle}" permanently from institutional vault?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch('/api/dashboard/material', {
              method: 'POST',
              body: JSON.stringify({ action: 'DELETE_ASSET', payload: { id } }),
            })
            fetchMaterials()
          } catch {
            Alert.alert('Error', 'Could not delete asset.')
          }
        },
      },
    ])
  }

  const handleOpenUrl = (fileUrl?: string) => {
    if (!fileUrl) return
    const fullUrl = fileUrl.startsWith('http')
      ? fileUrl
      : `https://contactharisolutions-pixel.supabase.co/storage/v1/object/public/study-materials/${fileUrl}`
    WebBrowser.openBrowserAsync(fullUrl)
  }

  const totalStorage = materials.reduce((acc, m) => acc + parseFloat(m.file_size || '0'), 0).toFixed(1)

  const filtered = useMemo(() => {
    let list = materials
    if (tab !== 'all') list = list.filter(m => m.type === tab)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(m => m.title.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q))
    }
    return list
  }, [materials, tab, search])

  const TABS: { key: TabType; label: string }[] = [
    { key: 'all', label: 'All Vault' },
    { key: 'pdf', label: 'PDFs' },
    { key: 'video', label: 'Videos' },
    { key: 'notes', label: 'Notes' },
  ]

  const getTypeIcon = (mType: string) => {
    if (mType === 'pdf') return <FileText size={20} color="#EF4444" />
    if (mType === 'video') return <Video size={20} color="#004B93" />
    return <Book size={20} color="#F59E0B" />
  }

  if (loading && materials.length === 0) {
    return (
      <View style={s.container}>
        <TeacherHeader showSearch={false} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#004B93" />
          <Text style={s.loadingText}>Opening Asset Vault…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <TeacherHeader onSearch={setSearch} searchPlaceholder="Search materials…" />

      {/* Vault Header Bar */}
      <View style={s.vaultHeader}>
        <View style={s.vaultHeaderRow}>
          <FolderOpen size={18} color="#004B93" />
          <Text style={s.vaultTitle}>Study Materials Vault</Text>
        </View>
        <View style={s.storageRow}>
          <HardDrive size={12} color="#64748B" />
          <Text style={s.storageText}>{totalStorage} MB Used</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={s.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Materials List */}
      <FlatList
        data={filtered}
        keyExtractor={m => m.id}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <FolderOpen size={44} color="#CBD5E1" />
            <Text style={s.emptyTitle}>{search ? 'No materials match search' : 'Vault is empty'}</Text>
            <Text style={s.emptySub}>Tap + to upload curriculum assets</Text>
          </View>
        }
        renderItem={({ item: m }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View style={s.iconWrap}>{getTypeIcon(m.type)}</View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle} numberOfLines={1}>
                  {m.title}
                </Text>
                <View style={s.badgeRow}>
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{m.subject}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: '#F1F5F9' }]}>
                    <Text style={[s.badgeText, { color: '#64748B' }]}>{m.class_name}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(m.id, m.title)} style={s.deleteBtn}>
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <View style={s.cardFooter}>
              <Text style={s.fileMeta}>
                {m.file_size || '1.0 MB'} · {new Date(m.created_at).toLocaleDateString()}
              </Text>
              <TouchableOpacity style={s.openBtn} onPress={() => handleOpenUrl(m.file_url)}>
                <ExternalLink size={13} color="#FFFFFF" />
                <Text style={s.openBtnText}>View Asset</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setShowModal(true)} activeOpacity={0.85}>
        <Plus size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Upload Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Deploy Resource Vector</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} style={s.modalCloseBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <View style={s.formField}>
              <Text style={s.formLabel}>Asset Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Organic Chemistry Class 12 Notes"
                placeholderTextColor="#94A3B8"
                style={s.formInput}
              />
            </View>

            <View style={s.formField}>
              <Text style={s.formLabel}>Subject</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="Mathematics, Physics..."
                placeholderTextColor="#94A3B8"
                style={s.formInput}
              />
            </View>

            <View style={s.formField}>
              <Text style={s.formLabel}>Resource Type</Text>
              <View style={s.typeGrid}>
                {[
                  { id: 'pdf', label: 'PDF Document' },
                  { id: 'video', label: 'Video Lecture' },
                  { id: 'notes', label: 'Study Notes' },
                ].map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[s.typeChip, type === t.id && s.typeChipActive]}
                    onPress={() => setType(t.id as any)}
                  >
                    <Text style={[s.typeChipText, type === t.id && { color: '#004B93' }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Document Picker Box */}
            <View style={s.formField}>
              <Text style={s.formLabel}>Select File Payload *</Text>
              <TouchableOpacity style={s.pickerBox} onPress={handlePickDocument} activeOpacity={0.8}>
                <UploadCloud size={32} color="#64748B" />
                <Text style={s.pickerTitle}>
                  {selectedFile ? selectedFile.name : 'Tap to select document from device'}
                </Text>
                {selectedFile && (
                  <Text style={s.pickerSize}>
                    {(selectedFile.size! / (1024 * 1024)).toFixed(2)} MB · {selectedFile.mimeType}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.uploadBtn} onPress={handleUpload} disabled={uploading} activeOpacity={0.85}>
              {uploading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <CheckCircle size={18} color="#FFFFFF" />
                  <Text style={s.uploadBtnText}>Deploy to Vault</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EBF3FC' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600' },
  vaultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF2F8' },
  vaultHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vaultTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  storageRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  storageText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  tabRow: { flexDirection: 'row', padding: 8, gap: 8, backgroundColor: '#FFFFFF' },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#EEF2F8' },
  tabActive: { backgroundColor: '#004B93', borderColor: '#004B93' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '900' },
  listContent: { padding: 16, paddingBottom: 96 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#004B93', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEF2F8' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  badge: { backgroundColor: '#EBF3FC', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#004B93' },
  deleteBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  fileMeta: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  openBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#004B93', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  openBtnText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#64748B', marginTop: 16 },
  emptySub: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 4 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#004B93', alignItems: 'center', justifyContent: 'center', shadowColor: '#004B93', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEF2F8' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  formField: { marginBottom: 16 },
  formLabel: { fontSize: 12, fontWeight: '800', color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  formInput: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, fontSize: 14, fontWeight: '600', color: '#0F172A', backgroundColor: '#F8FAFC' },
  typeGrid: { flexDirection: 'row', gap: 8 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', alignItems: 'center' },
  typeChipActive: { borderColor: '#004B93', backgroundColor: '#EBF3FC' },
  typeChipText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  pickerBox: { borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', backgroundColor: '#F8FAFC', gap: 8 },
  pickerTitle: { fontSize: 12, fontWeight: '700', color: '#334155', textAlign: 'center' },
  pickerSize: { fontSize: 10, fontWeight: '600', color: '#004B93' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#004B93', borderRadius: 16, paddingVertical: 16, marginTop: 10, shadowColor: '#004B93', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  uploadBtnText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
})
