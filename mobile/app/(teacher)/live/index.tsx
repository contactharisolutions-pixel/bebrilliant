import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { Video, Plus, Calendar, Clock, X, Link as LinkIcon, Radio } from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'

interface LiveClass {
  id: string
  title: string
  scheduled_at: string
  duration_minutes: number
  status: 'scheduled' | 'live' | 'completed'
  join_url: string
  auto_record: boolean
}

export default function TeacherLive() {
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [scheduling, setScheduling] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [duration, setDuration] = useState('60')
  const [autoRecord, setAutoRecord] = useState(true)

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/dashboard/live')
      setClasses(data?.classes || [])
    } catch (e: any) {
      console.error(e)
      Alert.alert('Error', 'Failed to load live sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleLaunchSession = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url)
    } catch (e) {
      Alert.alert('Error', 'Could not open live classroom')
    }
  }

  const handleSchedule = async () => {
    if (!title || !date) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setScheduling(true)
    try {
      await apiFetch('/api/dashboard/live', {
        method: 'POST',
        body: JSON.stringify({
          action: 'SCHEDULE_CLASS',
          payload: {
            title,
            date: new Date(date).toISOString(),
            duration: Number(duration),
            auto_record: autoRecord,
            teacher_id: '' // Defaults to self
          }
        })
      })
      Alert.alert('Success', 'Live session scheduled successfully!')
      setModalVisible(false)
      setTitle('')
      setDate('')
      fetchClasses()
    } catch (e: any) {
      console.error(e)
      Alert.alert('Scheduling Failed', e.message || 'Something went wrong.')
    } finally {
      setScheduling(false)
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
    <View className="flex-1 bg-bg-card2">
      {/* Header bar */}
      <View className="px-5 py-4 bg-white border-b border-border flex-row justify-between items-center">
        <Text className="text-base font-black text-text-primary">Live Sessions</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="flex-row items-center bg-primary px-4 py-2 rounded-xl"
        >
          <Plus size={16} color="#FFF" />
          <Text className="text-white font-bold text-xs ml-1.5">Schedule</Text>
        </TouchableOpacity>
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
                <View className="flex-row items-center mt-2.5 space-x-4">
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
              onPress={() => handleLaunchSession(item.join_url)}
              className="mt-5 flex-row items-center justify-center rounded-xl bg-primary py-3 shadow-sm active:opacity-90"
            >
              <Text className="text-white font-bold text-sm">Join / Start Session</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Scheduler Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6 space-y-5">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-black text-text-primary">Schedule Session</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="p-1">
                <X size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <View className="space-y-1">
              <Text className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Session Title
              </Text>
              <TextInput
                className="rounded-xl border border-border bg-bg-card2 px-4 py-3 text-base text-text-primary"
                placeholder="e.g. Physics Class 11 | Chapter 2"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Date/Time */}
            <View className="space-y-1 mt-4">
              <Text className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Launch Timestamp (YYYY-MM-DD HH:MM)
              </Text>
              <TextInput
                className="rounded-xl border border-border bg-bg-card2 px-4 py-3 text-base text-text-primary"
                placeholder="e.g. 2026-07-12 10:00"
                placeholderTextColor="#9CA3AF"
                value={date}
                onChangeText={setDate}
              />
            </View>

            {/* Duration */}
            <View className="space-y-1 mt-4">
              <Text className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Duration (Minutes)
              </Text>
              <TextInput
                className="rounded-xl border border-border bg-bg-card2 px-4 py-3 text-base text-text-primary"
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />
            </View>

            {/* Action */}
            <TouchableOpacity
              onPress={handleSchedule}
              disabled={scheduling}
              className="mt-6 flex-row items-center justify-center rounded-xl bg-primary py-4 shadow-lg active:opacity-90"
            >
              {scheduling ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-white font-bold text-base">Schedule class</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}
