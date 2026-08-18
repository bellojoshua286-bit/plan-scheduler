import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch, TextInput
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../constants/colors'
import { useTheme } from '../../context/ThemeContext'

export default function Profile() {
  const [userName,    setUserName]    = useState('')
  const [userEmail,   setUserEmail]   = useState('')
  const [subScreen,   setSubScreen]   = useState(null)
  const [notifs,      setNotifs]      = useState({
    push: true, daily: true, streak: true, weekly: false
  })
  const [twoFA,       setTwoFA]       = useState(false)
  const [faqOpen,     setFaqOpen]     = useState(null)
  const [bugText,     setBugText]     = useState('')
  const [bugSent,     setBugSent]     = useState(false)
  const [featureText, setFeatureText] = useState('')
  const [featureSent, setFeatureSent] = useState(false)

  const router = useRouter()
  const { dark, toggle, colors } = useTheme()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.full_name || 'User')
        setUserEmail(user.email || '')
      }
    })
  }, [])

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          router.replace('/login')
        }
      }
    ])
  }

  const handlePasswordReset = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.auth.resetPasswordForEmail(
      user.email,
      { redirectTo: 'planscheduler://reset-password' }
    )
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert(
        'Email Sent! 📧',
        `A password reset link has been sent to ${user.email}. ` +
        'Click the link in your email to set a new password.',
        [{ text: 'OK' }]
      )
    }
  }

  /* ── NOTIFICATIONS ── */
  if (subScreen === 'notifications') return (
    <ScrollView style={[styles.container,
      { backgroundColor: colors.bg }]}>
      <View style={[styles.subHeader]}>
        <TouchableOpacity onPress={() => setSubScreen(null)}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.subTitle}>Notifications</Text>
      </View>
      {[
        { key:'push',   label:'Push Notifications',
          desc:'Get notified when a plan is due' },
        { key:'daily',  label:'Daily Summary',
          desc:'Morning recap of your plans' },
        { key:'streak', label:'Streak Reminder',
          desc:'Alert if no task completed today' },
        { key:'weekly', label:'Weekly Report',
          desc:'Summary every Sunday evening' },
      ].map(item => (
        <View key={item.key} style={[styles.settingRow, {
          backgroundColor: colors.card,
          borderColor: colors.border,
        }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel,
              { color: colors.text }]}>
              {item.label}
            </Text>
            <Text style={[styles.settingDesc,
              { color: colors.muted }]}>
              {item.desc}
            </Text>
          </View>
          <Switch
            value={notifs[item.key]}
            onValueChange={v =>
              setNotifs(n => ({ ...n, [item.key]: v }))
            }
            trackColor={{ true: COLORS.primary }}
          />
        </View>
      ))}
    </ScrollView>
  )

  /* ── PRIVACY & SECURITY ── */
  if (subScreen === 'privacy') return (
    <ScrollView style={[styles.container,
      { backgroundColor: colors.bg }]}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setSubScreen(null)}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.subTitle}>Privacy & Security</Text>
      </View>

      {/* 2FA */}
      <View style={[styles.sectionCard, {
        backgroundColor: colors.card,
        borderColor: colors.border,
      }]}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel,
              { color: colors.text }]}>
              🔐 Two-Factor Authentication
            </Text>
            <Text style={[styles.settingDesc,
              { color: colors.muted }]}>
              Extra security on login
            </Text>
          </View>
          <Switch
            value={twoFA}
            onValueChange={setTwoFA}
            trackColor={{ true: COLORS.primary }}
          />
        </View>
        {twoFA && (
          <View style={styles.infoBox}>
            <Text style={{
              color: COLORS.primary,
              fontSize: 13, fontWeight: '600',
            }}>
              ✅ 2FA active. A code will be sent to your
              email on each login.
            </Text>
          </View>
        )}
      </View>

      {/* Data Policy */}
      <View style={[styles.sectionCard, {
        backgroundColor: colors.card,
        borderColor: colors.border,
      }]}>
        <Text style={[styles.settingLabel, {
          color: colors.text, marginBottom: 10
        }]}>
          👁 How We Use Your Data
        </Text>
        {[
          'Your plans are stored securely and never sold.',
          'Activity data is only used to improve your experience.',
          'You can delete all your data at any time.',
        ].map((t, i) => (
          <Text key={i} style={[styles.settingDesc, {
            color: colors.muted, marginBottom: 6
          }]}>
            • {t}
          </Text>
        ))}
      </View>

      {/* Change Password — Email Verification */}
      <View style={[styles.sectionCard, {
        backgroundColor: colors.card,
        borderColor: colors.border,
      }]}>
        <Text style={[styles.settingLabel, {
          color: colors.text, marginBottom: 4
        }]}>
          🔑 Change Password
        </Text>
        <Text style={[styles.settingDesc, {
          color: colors.muted, marginBottom: 12
        }]}>
          A verification link will be sent to your email first.
          Click it to confirm before setting a new password.
        </Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handlePasswordReset}>
          <Text style={styles.actionBtnText}>
            Send Password Reset Email
          </Text>
        </TouchableOpacity>
      </View>

      {/* Export */}
      <View style={[styles.sectionCard, {
        backgroundColor: colors.card,
        borderColor: colors.border,
      }]}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel,
              { color: colors.text }]}>
              📤 Export My Data
            </Text>
            <Text style={[styles.settingDesc,
              { color: colors.muted }]}>
              Download a copy of all your plans
            </Text>
          </View>
          <TouchableOpacity style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete Account */}
      <View style={[styles.sectionCard, {
        backgroundColor: colors.card,
        borderColor: COLORS.accent + '44',
      }]}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel,
              { color: COLORS.accent }]}>
              🗑 Delete Account
            </Text>
            <Text style={[styles.settingDesc,
              { color: colors.muted }]}>
              Permanently removes all your data
            </Text>
          </View>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={() => Alert.alert(
              'Delete Account',
              'This will permanently delete all your data. ' +
              'This cannot be undone. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive',
                  onPress: () => {} }
              ]
            )}>
            <Text style={styles.dangerBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  )

  /* ── HELP & SUPPORT ── */
  if (subScreen === 'help') {
    const faqs = [
      { q: 'How do I add a plan?',
        a: 'Tap the + Add button or the Add a Plan button on the Home screen.' },
      { q: 'How do streaks work?',
        a: 'Complete at least one plan every day. ' +
           'Miss a day and your streak resets to zero.' },
      { q: 'How do I earn credits?',
        a: 'You earn 10 credits for every streak day. ' +
           'Spend them in the Progress tab to unlock themes and features.' },
      { q: 'Can I set recurring reminders?',
        a: 'Yes — when adding a plan, select Daily, Weekly or Monthly ' +
           'repeat and then pick your reminder days.' },
      { q: 'Will I lose data if I log out?',
        a: 'No. Everything is saved to the cloud. ' +
           'Log back in to restore all your plans.' },
    ]
    return (
      <ScrollView style={[styles.container,
        { backgroundColor: colors.bg }]}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setSubScreen(null)}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>Help & Support</Text>
        </View>

        <Text style={[styles.sectionLabel,
          { color: colors.text }]}>
          ❓ Frequently Asked Questions
        </Text>
        {faqs.map((f, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.faqItem, {
              backgroundColor: colors.card,
              borderColor: colors.border,
            }]}
            onPress={() => setFaqOpen(faqOpen === i ? null : i)}>
            <View style={styles.rowBetween}>
              <Text style={[styles.faqQ, {
                color: colors.text, flex: 1, paddingRight: 8
              }]}>
                {f.q}
              </Text>
              <Text style={{ color: colors.muted }}>
                {faqOpen === i ? '▲' : '▼'}
              </Text>
            </View>
            {faqOpen === i && (
              <Text style={[styles.faqA,
                { color: colors.muted }]}>
                {f.a}
              </Text>
            )}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel,
          { color: colors.text }]}>
          🐛 Report a Bug
        </Text>
        <View style={[styles.sectionCard, {
          backgroundColor: colors.card,
          borderColor: colors.border,
        }]}>
          {bugSent ? (
            <View style={{ alignItems: 'center', padding: 12 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>
                ✅
              </Text>
              <Text style={{
                color: COLORS.accentGreen,
                fontWeight: '700', fontSize: 14,
              }}>
                Report Sent!
              </Text>
              <Text style={{
                color: colors.muted,
                fontSize: 13, marginTop: 4,
              }}>
                We'll look into it within 6–12 hours.
              </Text>
            </View>
          ) : (
            <>
              <TextInput
                value={bugText}
                onChangeText={setBugText}
                placeholder="Describe the bug..."
                placeholderTextColor={colors.muted}
                multiline
                style={[styles.textarea, {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.bg,
                }]}
              />
              <TouchableOpacity
                style={[styles.actionBtn, {
                  backgroundColor: bugText.trim()
                    ? COLORS.primary : colors.border
                }]}
                onPress={() => {
                  if (bugText.trim()) setBugSent(true)
                }}>
                <Text style={[styles.actionBtnText, {
                  color: bugText.trim() ? '#fff' : colors.muted
                }]}>
                  Submit Report
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={[styles.sectionLabel,
          { color: colors.text }]}>
          💡 Suggest a Feature
        </Text>
        <View style={[styles.sectionCard, {
          backgroundColor: colors.card,
          borderColor: colors.border,
          marginBottom: 40,
        }]}>
          {featureSent ? (
            <View style={{ alignItems: 'center', padding: 12 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>
                🎉
              </Text>
              <Text style={{
                color: COLORS.primary,
                fontWeight: '700', fontSize: 14,
              }}>
                Suggestion Received!
              </Text>
              <Text style={{
                color: colors.muted,
                fontSize: 13, marginTop: 4,
              }}>
                Thank you for your idea!
              </Text>
            </View>
          ) : (
            <>
              <TextInput
                value={featureText}
                onChangeText={setFeatureText}
                placeholder="What would make Plan Scheduler better?"
                placeholderTextColor={colors.muted}
                multiline
                style={[styles.textarea, {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.bg,
                }]}
              />
              <TouchableOpacity
                style={[styles.actionBtn, {
                  backgroundColor: featureText.trim()
                    ? COLORS.primary : colors.border
                }]}
                onPress={() => {
                  if (featureText.trim()) setFeatureSent(true)
                }}>
                <Text style={[styles.actionBtnText, {
                  color: featureText.trim() ? '#fff' : colors.muted
                }]}>
                  Send Suggestion
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={[styles.sectionCard, {
          backgroundColor: colors.card,
          borderColor: colors.border,
          marginBottom: 40,
        }]}>
          <Text style={[styles.settingLabel, {
            color: colors.text, marginBottom: 8
          }]}>
            📧 Contact Us
          </Text>
          <Text style={[styles.settingDesc, { color: colors.muted }]}>
            Email:{' '}
            <Text style={{ color: COLORS.primary }}>
              support@planscheduler.app
            </Text>
          </Text>
          <Text style={[styles.settingDesc, {
            color: colors.muted, marginTop: 4
          }]}>
            Response time: 6–12 hours
          </Text>
        </View>

      </ScrollView>
    )
  }

  /* ── ACCOUNT ── */
  if (subScreen === 'account') return (
    <ScrollView style={[styles.container,
      { backgroundColor: colors.bg }]}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setSubScreen(null)}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.subTitle}>Account</Text>
      </View>
      <View style={[styles.sectionCard, {
        backgroundColor: colors.card,
        borderColor: colors.border,
      }]}>
        <Text style={[styles.settingDesc, {
          color: colors.muted, marginBottom: 4
        }]}>
          CURRENT PLAN
        </Text>
        <Text style={[styles.subTitle, {
          color: colors.text, marginBottom: 16,
          fontSize: 22,
        }]}>
          Free Tier
        </Text>
        <View style={styles.infoBox}>
          <Text style={{
            color: COLORS.primary,
            fontWeight: '700', fontSize: 13, marginBottom: 8,
          }}>
            What's included:
          </Text>
          {[
            'Unlimited plans and reminders',
            'Streak tracking and credits',
            'All 5 categories',
            'Cloud sync across devices',
            'Help and support',
          ].map((f, i) => (
            <Text key={i} style={{
              color: COLORS.primary,
              fontSize: 13, marginBottom: 6,
            }}>
              ✓ {f}
            </Text>
          ))}
        </View>
        <View style={{
          marginTop: 16, padding: 12,
          backgroundColor: COLORS.accentYellow + '22',
          borderRadius: 10,
        }}>
          <Text style={{
            color: '#B7791F', fontSize: 13, fontWeight: '600'
          }}>
            🚀 AI scheduling and premium features are coming
            in a future update.
          </Text>
        </View>
      </View>
    </ScrollView>
  )

  /* ── MAIN PROFILE MENU ── */
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      showsVerticalScrollIndicator={false}>

      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 32 }}>👤</Text>
        </View>
        <Text style={styles.profileName}>{userName}</Text>
        <Text style={styles.profileEmail}>{userEmail}</Text>
        <Text style={styles.profileSince}>
          Member since July 2026
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        {[
          { icon:'🔔', label:'Notifications',
            action: () => setSubScreen('notifications') },
          { icon:'🌙', label:'Dark Mode',
            detail: dark ? 'On' : 'Off',
            action: toggle },
          { icon:'📊', label:'Account',
            detail: 'Free',
            action: () => setSubScreen('account') },
          { icon:'🔒', label:'Privacy & Security',
            action: () => setSubScreen('privacy') },
          { icon:'❓', label:'Help & Support',
            action: () => setSubScreen('help') },
          { icon:'🚪', label:'Log Out',
            action: handleLogout,
            danger: true },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={item.action}
            style={[styles.menuRow, {
              backgroundColor: colors.card,
              borderColor: colors.border,
            }]}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={[styles.menuLabel, {
              color: item.danger ? COLORS.accent : colors.text
            }]}>
              {item.label}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              {item.detail || ''} ›
            </Text>
          </TouchableOpacity>
        ))}
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  profileHeader:  {
    backgroundColor: COLORS.primary,
    padding: 48, paddingTop: 64,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
  },
  avatar:         {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  profileName:    {
    color: '#fff', fontWeight: '800', fontSize: 20
  },
  profileEmail:   {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13, marginTop: 4,
  },
  profileSince:   {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12, marginTop: 2,
  },
  menuRow:        {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1.5,
  },
  menuIcon:       { fontSize: 20 },
  menuLabel:      { flex: 1, fontWeight: '600', fontSize: 14 },
  subHeader:      {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 24, paddingTop: 56,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 20,
  },
  backBtn:        {
    color: '#fff', fontSize: 24, fontWeight: '600'
  },
  subTitle:       {
    color: '#fff', fontWeight: '800', fontSize: 20
  },
  sectionLabel:   {
    fontWeight: '700', fontSize: 15,
    marginLeft: 20, marginBottom: 10, marginTop: 8,
  },
  settingRow:     {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, marginHorizontal: 20,
    marginBottom: 10, borderRadius: 14, borderWidth: 1.5,
  },
  settingLabel:   { fontWeight: '600', fontSize: 14 },
  settingDesc:    { fontSize: 12, marginTop: 2 },
  sectionCard:    {
    marginHorizontal: 20, marginBottom: 12,
    borderRadius: 16, padding: 16, borderWidth: 1.5,
  },
  rowBetween:     {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoBox:        {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10, padding: 12, marginTop: 12,
  },
  input:          {
    borderWidth: 1.5, borderRadius: 10,
    padding: 12, fontSize: 14, marginBottom: 8,
  },
  textarea:       {
    borderWidth: 1.5, borderRadius: 10,
    padding: 12, fontSize: 13,
    height: 90, textAlignVertical: 'top',
    marginBottom: 10,
  },
  actionBtn:      {
    padding: 12, borderRadius: 12, alignItems: 'center'
  },
  actionBtnText:  { fontWeight: '700', fontSize: 14 },
  outlineBtn:     {
    borderWidth: 1.5, borderColor: COLORS.primary,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10,
  },
  outlineBtnText: {
    color: COLORS.primary, fontWeight: '700', fontSize: 12
  },
  dangerBtn:      {
    borderWidth: 1.5, borderColor: COLORS.accent,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10,
  },
  dangerBtnText:  {
    color: COLORS.accent, fontWeight: '700', fontSize: 12
  },
  faqItem:        {
    marginHorizontal: 20, marginBottom: 8,
    borderRadius: 14, padding: 14, borderWidth: 1.5,
  },
  faqQ:           { fontWeight: '600', fontSize: 13 },
  faqA:           { fontSize: 13, marginTop: 10, lineHeight: 20 },
})