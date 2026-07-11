import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as WebBrowser from 'expo-web-browser'
import { FileText, Video, Plus, File, Trash } from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'
import { supabase } from '../../../lib/supabase'

interface Material {
  id: string
  title: string
  type: 'pdf' | 'video' | 'notes' | 'assignment'
  subject: string
  class_name: string
  file_url: string
  file_size?: string
}

export default function TeacherMaterials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/dashboard/material')
      setMaterials(data || [])
    } catch (e: any) {
      console.error(e)
      Alert.alert('Error', 'Failed to load study materials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

  const handleOpenMaterial = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url)
    } catch (e) {
      Alert.alert('Error', 'Could not open material link')
    }
  }

  const handlePickAndUpload = async () => {
    setUploading(true)
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'video/*'],
        copyToCacheDirectory: true
      })

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setUploading(false)
        return
      }

      const file = result.assets[0]
      const fileUri = file.uri
      const fileName = file.name
      const fileExt = fileName.split('.').pop()
      const mimeType = file.mimeType || 'application/octet-stream'

      // 1. Fetch file as blob to upload
      const response = await fetch(fileUri)
      const blob = await response.blob()

      // 2. Upload to Supabase Storage
      const dbPath = `materials/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('bebrilliant')
        .upload(dbPath, blob, {
          contentType: mimeType,
          upsert: true
        })

      if (uploadErr) throw uploadErr

      // 3. Get Public URL
      const { data: urlData } = supabase.storage.from('bebrilliant').getPublicUrl(dbPath)
      const publicUrl = urlData.publicUrl

      // 4. Create Material Record in Postgres
      const sizeMB = file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'
      const isVideo = mimeType.startsWith('video/')

      await apiFetch('/api/dashboard/material', {
        method: 'POST',
        body: JSON.stringify({
          action: 'CREATE_ASSET',
          payload: {
            title: fileName,
            type: isVideo ? 'video' : 'pdf',
            subject: 'General Science',
            class_name: 'Grade 10',
            file_url: publicUrl,
            file_size: sizeMB
          }
        })
      })

      Alert.alert('Success', 'Material uploaded successfully!')
      fetchMaterials()
    } catch (e: any) {
      console.error(e)
      Alert.alert('Upload Failed', e.message || 'Something went wrong during upload.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteMaterial = async (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to remove this material?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch('/api/dashboard/material', {
                method: 'POST',
                body: JSON.stringify({
                  action: 'DELETE_ASSET',
                  payload: { id }
                })
              })
              Alert.alert('Deleted', 'Material removed successfully')
              fetchMaterials()
            } catch (e: any) {
              Alert.alert('Error', 'Failed to delete material')
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center">
        <ActivityIndicator size="large" color="#004B93" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-bg-card2">
      {/* Upload Header */}
      <View className="px-5 py-4 bg-white border-b border-border flex-row justify-between items-center">
        <Text className="text-base font-black text-text-primary">Vault Material Files</Text>
        <TouchableOpacity
          onPress={handlePickAndUpload}
          disabled={uploading}
          className="flex-row items-center bg-primary px-4 py-2 rounded-xl"
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Plus size={16} color="#FFF" />
              <Text className="text-white font-bold text-xs ml-1.5">Upload File</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Materials List */}
      <FlatList
        data={materials}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <File size={48} color="#9CA3AF" />
            <Text className="text-base font-bold text-text-secondary mt-4">No materials uploaded yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between rounded-2xl bg-white border border-border p-4 shadow-sm mb-4">
            <TouchableOpacity
              onPress={() => handleOpenMaterial(item.file_url)}
              className="flex-row items-center flex-1 pr-4 active:opacity-85"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mr-4">
                {item.type === 'video' ? (
                  <Video size={20} color="#004B93" />
                ) : (
                  <FileText size={20} color="#004B93" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-text-primary" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-xs text-text-muted mt-0.5">
                  Subject: {item.subject || 'General'} · Size: {item.file_size || 'N/A'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleDeleteMaterial(item.id)} className="p-2">
              <Trash size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  )
}
