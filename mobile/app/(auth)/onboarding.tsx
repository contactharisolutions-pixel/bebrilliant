import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Dimensions, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { BookOpen, Award, Users, ChevronRight } from 'lucide-react-native'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    title: 'Achieve Academic Brilliance',
    desc: 'BeBrilliant connects teachers, students, and parents in a unified educational ecosystem.',
    icon: BookOpen,
    color: '#004B93',
  },
  {
    title: 'Smart Assessments & AI',
    desc: 'Attempt exams with real-time timers, review instant grading, and analyze performance charts.',
    icon: Award,
    color: '#1FAC63',
  },
  {
    title: 'Stay Constantly Connected',
    desc: 'Parents monitor child progress, teachers manage classrooms, and students access premium study resources.',
    icon: Users,
    color: '#336FA9',
  },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      router.replace('/(auth)/login')
    }
  }

  const SlideIcon = SLIDES[currentSlide].icon

  return (
    <View className="flex-1 bg-white justify-between px-6 py-16">
      {/* Top Header */}
      <View className="flex-row justify-between items-center">
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 90, height: 36 }}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text className="text-sm font-bold text-text-secondary">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View className="items-center py-10">
        <View 
          className="h-44 w-44 items-center justify-center rounded-full mb-10"
          style={{ backgroundColor: `${SLIDES[currentSlide].color}15` }}
        >
          <SlideIcon size={72} color={SLIDES[currentSlide].color} />
        </View>

        <Text className="text-2xl font-black text-center tracking-tight text-text-primary px-4">
          {SLIDES[currentSlide].title}
        </Text>
        <Text className="mt-4 text-base text-center text-text-secondary leading-6 px-6">
          {SLIDES[currentSlide].desc}
        </Text>
      </View>

      {/* Footer / Stepper & Actions */}
      <View className="space-y-6">
        {/* Indicators */}
        <View className="flex-row justify-center space-x-2">
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-8 bg-primary' : 'w-2.5 bg-border'
              }`}
            />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center rounded-xl bg-primary py-4 shadow-lg shadow-primary/20 active:opacity-90 mt-6"
          onPress={handleNext}
        >
          <Text className="text-base font-bold text-white mr-2">
            {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <ChevronRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  )
}
