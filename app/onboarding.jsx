import { useState } from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, Dimensions
} from 'react-native'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '../context/ThemeContext'

const { width } = Dimensions.get('window')

const slides = [
  {
    emoji:    '📅',
    title:    'Plan Your Days',
    subtitle: 'Schedule events, tasks and goals — all in one place. Never forget what matters.',
    color:    '#5B4FE9',
  },
  {
    emoji:    '🔔',
    title:    'Smart Reminders',
    subtitle: 'Get notified at exactly the right time with alarms and daily reminders.',
    color:    '#FF6B6B',
  },
  {
    emoji:    '🔥',
    title:    'Build Your Streak',
    subtitle: 'Stay consistent every day. Earn credits and unlock beautiful app themes.',
    color:    '#FFD166',
  },
]

export default function Onboarding() {
  const [current, setCurrent] = useState(0)
  const router  = useRouter()
  const slide   = slides[current]

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true')
    router.replace('/login')
  }

  return (
    <View style={[styles.container,
      { backgroundColor: slide.color }]}>

      <View style={styles.content}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>

      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, {
              width:   i === current ? 24 : 8,
              opacity: i === current ? 1  : 0.4,
            }]} />
          ))}
        </View>

        {current < slides.length - 1 ? (
          <TouchableOpacity
            style={styles.btn}
            onPress={() => setCurrent(c => c + 1)}>
            <Text style={[styles.btnText,
              { color: slide.color }]}>
              Next →
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.btn}
            onPress={handleGetStarted}>
            <Text style={[styles.btnText,
              { color: slide.color }]}>
              Get Started
            </Text>
          </TouchableOpacity>
        )}

        {current > 0 && (
          <TouchableOpacity
            onPress={() => setCurrent(c => c - 1)}
            style={{ marginTop: 12, padding: 12 }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji:    { fontSize: 80, marginBottom: 32 },
  title:    {
    color: '#fff', fontSize: 28, fontWeight: '800',
    textAlign: 'center', marginBottom: 16,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)', fontSize: 16,
    textAlign: 'center', lineHeight: 24,
  },
  footer:   {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24, padding: 32, margin: 16,
  },
  dots:     {
    flexDirection: 'row', justifyContent: 'center',
    gap: 8, marginBottom: 32,
  },
  dot:      { height: 8, borderRadius: 4, backgroundColor: '#fff' },
  btn:      {
    backgroundColor: '#fff', padding: 16,
    borderRadius: 16, alignItems: 'center',
  },
  btnText:  { fontWeight: '700', fontSize: 16 },
  backText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600', textAlign: 'center',
  },
})