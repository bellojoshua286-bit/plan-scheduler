import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'

export default function Index() {
  const router  = useRouter()
  const [loading, setLoading] = useState(true)
  const { primary } = useTheme()

  useEffect(() => {
    checkAppState()
  }, [])

  const checkAppState = async () => {
    try {
      // Check if user has seen onboarding
      const seen = await AsyncStorage.getItem('hasSeenOnboarding')

      if (!seen) {
        // First time — show onboarding
        router.replace('/onboarding')
        setLoading(false)
        return
      }

      // Returning user — check if logged in
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/(tabs)/home')
      } else {
        router.replace('/login')
      }
    } catch (e) {
      router.replace('/onboarding')
    }
    setLoading(false)
  }

  if (loading) return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: primary,
    }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  )

  return null
}