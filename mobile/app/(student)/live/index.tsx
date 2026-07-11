import React from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Video, ArrowLeft, Calendar, Clock, Radio } from 'lucide-react-native'
import { useStudentLive } from '../../../hooks/useStudentLive'

export default function StudentLive() {
  const router = useRouter()
  const { data, isLoading } = useStudentLive()

  const handleJoinClass = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url)
    } catch (e) {
      Alert.alert('Error', 'Could not open live lecture room')
    }
  }

  const classes = data?.classes || []

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
        <Text className="text-lg font-black text-text-primary">Live Classroom</Text>
      </View>

      {/* Classes list */}
      <FlatList
        data={classes}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Video size={48} color="#9CA3AF" />
            <Text className="text-base font-bold text-text-secondary mt-4">No live sessions scheduled</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="rounded-2xl bg-white border border-border p-5 shadow-sm mb-4">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-4">
                <Text className="text-base font-black text-text-primary">{item.title}</Text>
                {item.teacher && (
                  <Text className="text-xs font-semibold text-text-secondary mt-1">
                    By Prof. {item.teacher.first_name} {item.teacher.last_name || ''}
                  </Text>
                )}
                <View className="flex-row items-center mt-3.5 space-x-4">
                  <View className="flex-row items-center">
                    <Calendar size={13} color="#9CA3AF" />
                    <Text className="text-xs text-text-secondary ml-1">
                      {new Date(item.scheduled_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="flex-row items-center ml-4">
                    <Clock size={13} color="#9CA3AF" />
                    <Text className="text-xs text-text-secondary ml-1">
                      {item.duration_minutes} Mins
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row items-center">
                {item.status === 'live' ? (
                  <View className="flex-row items-center bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                    <Radio size={12} color="#EF4444" />
                    <Text className="text-red-600 font-bold text-[10px] ml-1">LIVE</Text>
                  </View>
                ) : (
                  <View className="bg-bg-card2 border border-border px-2 py-0.5 rounded-md">
                    <Text className="text-text-muted font-bold text-[10px]">SCHEDULED</Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleJoinClass(item.join_url)}
              className="mt-5 flex-row items-center justify-center rounded-xl bg-primary py-3 shadow-sm active:opacity-90"
            >
              <Text className="text-white font-bold text-sm">Join Lecture</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  )
}
