import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { COLORS } from '../constants/colors'
import { useTheme } from '../context/ThemeContext'

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const router = useRouter()
  const { colors } = useTheme()

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    setLoading(false)
    if (error) Alert.alert('Sign Up Failed', error.message)
    else {
      Alert.alert(
        'Almost there! 🎉',
        'Check your email to confirm your account, then log in.'
      )
      router.replace('/login')
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSub}>
            Join Plan Scheduler today
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.muted }]}>
            FULL NAME
          </Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text,
            }]}
            placeholder="Joshua Doe"
            placeholderTextColor={colors.muted}
            value={fullName}
            onChangeText={setFullName}
          />

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
            placeholder="Min. 6 characters"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.btn}
            onPress={handleSignup}
            disabled={loading}>
            <Text style={styles.btnText}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={{ marginTop: 16, padding: 8 }}>
            <Text style={{
              color: colors.muted,
              textAlign: 'center',
              fontSize: 13,
            }}>
              Already have an account?{' '}
              <Text
                style={{ color: COLORS.primary, fontWeight: '700' }}
                onPress={() => router.push('/login')}>
                Log In
              </Text>
            </Text>
          </View>
        </View>

      </ScrollView>
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
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '800' },
  headerSub:   {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14, marginTop: 4,
  },
  form:        { padding: 24 },
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