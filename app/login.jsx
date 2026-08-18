import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { COLORS } from '../constants/colors'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const router = useRouter()
  const { colors } = useTheme()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email, password
    })
    setLoading(false)
    if (error) Alert.alert('Login Failed', error.message)
    else router.replace('/(tabs)/home')
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <View style={styles.header}>
        <Text style={styles.emoji}>📅</Text>
        <Text style={styles.headerTitle}>Plan Scheduler</Text>
        <Text style={styles.headerSub}>Your life, organised.</Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.muted }]}>
          EMAIL
        </Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
          }]}
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={[styles.label, { color: colors.muted }]}>
          PASSWORD
        </Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
          }]}
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.btn}
          onPress={handleLogin}
          disabled={loading}>
          <Text style={styles.btnText}>
            {loading ? 'Logging in...' : 'Log In'}
          </Text>
        </TouchableOpacity>

        {/* Plain text — only "Sign Up" word is tappable */}
        <View style={{ marginTop: 16, padding: 8 }}>
          <Text style={{
            color: colors.muted,
            textAlign: 'center',
            fontSize: 13,
          }}>
            Don't have an account?{' '}
            <Text
              style={{ color: COLORS.primary, fontWeight: '700' }}
              onPress={() => router.push('/signup')}>
              Sign Up
            </Text>
          </Text>
        </View>
      </View>

    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header:      {
    backgroundColor: COLORS.primary,
    padding: 48, paddingTop: 80,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  emoji:       { fontSize: 40 },
  headerTitle: {
    color: '#fff', fontSize: 26,
    fontWeight: '800', marginTop: 12,
  },
  headerSub:   {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14, marginTop: 4,
  },
  form:        { padding: 24, marginTop: 8 },
  label:       {
    fontSize: 12, fontWeight: '600',
    marginBottom: 6, marginTop: 12,
  },
  input:       {
    borderWidth: 1.5, borderRadius: 12,
    padding: 14, fontSize: 15,
  },
  btn:         {
    backgroundColor: COLORS.primary,
    padding: 16, borderRadius: 16,
    alignItems: 'center', marginTop: 24,
  },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
})