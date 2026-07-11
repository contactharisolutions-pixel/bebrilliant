import React from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { FileText, Video, ArrowLeft, File } from 'lucide-react-native'
import { useStudentMaterials } from '../../../hooks/useStudentMaterials'

export default function StudentMaterials() {
  const router = useRouter()
  const { data: materials, isLoading, refetch } = useStudentMaterials()

  const handleOpenMaterial = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url)
    } catch (e) {
      Alert.alert('Error', 'Could not open material file')
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-card2 items-center justify-center">
        <ActivityIndicator size="large" color="#004B93" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-bg-card2">
      {/* Header bar */}
      <View className="flex-row items-center px-5 py-4 bg-white border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-3">
          <ArrowLeft size={20} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-black text-text-primary">Study Vault</Text>
      </View>

      {/* Materials List */}
      <FlatList
        data={materials}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <File size={48} color="#9CA3AF" />
            <Text className="text-base font-bold text-text-secondary mt-4">No study materials uploaded yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleOpenMaterial(item.file_url)}
            className="flex-row items-center justify-between rounded-2xl bg-white border border-border p-4 shadow-sm mb-4 active:opacity-85"
          >
            <View className="flex-row items-center flex-1 pr-4">
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
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}
