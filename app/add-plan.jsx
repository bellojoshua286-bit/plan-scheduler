import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView,
  KeyboardAvoidingView, Platform, Modal
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'

const CATEGORIES = [
  { label:'Work',     icon:'💼', color:'#5B4FE9' },
  { label:'Health',   icon:'💪', color:'#06D6A0' },
  { label:'Personal', icon:'🌟', color:'#FF6B6B' },
  { label:'School',   icon:'📚', color:'#FFD166' },
  { label:'Social',   icon:'👥', color:'#FF9F43' },
]

const HOURS   = ['1','2','3','4','5','6','7','8','9','10','11','12']
const MINUTES = ['00','05','10','15','20','25','30','35','40','45','50','55']
const PERIODS = ['AM','PM']
const DAYS    = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

const PRESETS = [
  { label:'Every Day', days:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
  { label:'Weekdays',  days:['Mon','Tue','Wed','Thu','Fri'] },
  { label:'Weekends',  days:['Sat','Sun'] },
  { label:'Custom',    days:[] },
]

const SPELL = {
  meting:'meeting', wrk:'work', stuyd:'study',
  gyym:'gym', doctr:'doctor', frind:'friend',
  schol:'school', excercise:'exercise',
}

const KEYWORDS = {
  Work:    ['meeting','work','call','project','deadline','email','office'],
  Health:  ['gym','workout','run','exercise','doctor','meal','diet','walk'],
  Personal:['read','book','pray','meditate','hobby','shop','relax'],
  School:  ['study','class','lecture','assignment','exam','homework'],
  Social:  ['friend','family','dinner','party','visit','church','birthday'],
}

export default function AddPlan() {
  const router = useRouter()
  const { colors, primary, primaryLight } = useTheme()

  const [title,     setTitle]     = useState('')
  const [titleWarn, setTitleWarn] = useState('')
  const [titleHint, setTitleHint] = useState('')
  const [hour,      setHour]      = useState('9')
  const [minute,    setMinute]    = useState('00')
  const [period,    setPeriod]    = useState('AM')
  const [category,  setCategory]  = useState('Work')
  const [repeat,    setRepeat]    = useState('None')
  const [days,      setDays]      = useState([])
  const [preset,    setPreset]    = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [showTime,  setShowTime]  = useState(false)

  const onTitleChange = (val) => {
    setTitle(val)
    // Spell check
    const words = val.toLowerCase().split(' ')
    let warn = ''
    for (const w of words) {
      if (SPELL[w]) { warn = `Did you mean "${SPELL[w]}"?`; break }
    }
    setTitleWarn(warn)
    // Auto category
    if (!warn && val.length > 2) {
      const lower = val.toLowerCase()
      for (const [cat, kws] of Object.entries(KEYWORDS)) {
        if (kws.some(k => lower.includes(k))) {
          setCategory(cat)
          setTitleHint(`✨ Category set to ${cat}`)
          return
        }
      }
    }
    setTitleHint('')
  }

  const pickPreset = (p) => {
    setPreset(p.label)
    setDays(p.label === 'Custom' ? [] : p.days)
  }

  const toggleDay = (d) => {
    setPreset('Custom')
    setDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  const onRepeatChange = (r) => {
    setRepeat(r)
    if (r === 'None') { setDays([]); setPreset(null) }
  }

  const save = async () => {
    const t = title.trim()
    if (!t) {
      Alert.alert('Title required', 'Please enter what you are planning.')
      return
    }
    if (repeat !== 'None' && days.length === 0) {
      Alert.alert('Pick reminder days', 'Choose at least one day for your repeat.')
      return
    }

    setSaving(true)
    try {
      const { data: { user }, error: userError } =
        await supabase.auth.getUser()

      if (userError || !user) {
        Alert.alert('Not logged in', 'Please log in again.')
        setSaving(false)
        return
      }

      const today = new Date()
      const dateStr = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
      ].join('-')

      const { error } = await supabase.from('plans').insert({
        user_id:       user.id,
        title:         t,
        time:          `${hour}:${minute} ${period}`,
        category,
        repeat,
        date:          dateStr,
        done:          false,
        reminder_days: days,
        duration_minutes: 0,
        has_alarm:     false,
      })

      if (error) {
        Alert.alert('Could not save', error.message)
      } else {
        router.back()
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong.')
    }
    setSaving(false)
  }

  const cat = CATEGORIES.find(c => c.label === category)

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <ScrollView
        style={[s.screen, { backgroundColor: colors.bg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[s.header, { backgroundColor: primary }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
            <Text style={s.back}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>New Plan</Text>
        </View>

        <View style={s.body}>

          {/* ─── TITLE ─────────────────────────────── */}
          <Text style={[s.fieldLabel, { color: colors.muted }]}>
            WHAT'S THE PLAN?
          </Text>
          <TextInput
            style={[s.titleInput, {
              backgroundColor: colors.card,
              borderColor: titleWarn ? '#FFD166' : colors.border,
              color: colors.text,
            }]}
            placeholder="e.g. Morning run, Team meeting..."
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={onTitleChange}
            returnKeyType="done"
            autoFocus
          />
          {titleWarn
            ? <Text style={s.warn}>⚠ {titleWarn}</Text>
            : titleHint
            ? <Text style={s.hint}>{titleHint}</Text>
            : null}

          {/* ─── TIME ──────────────────────────────── */}
          <Text style={[s.fieldLabel, { color: colors.muted, marginTop: 24 }]}>
            TIME
          </Text>
          <TouchableOpacity
            style={[s.timeBtn, {
              backgroundColor: colors.card,
              borderColor: colors.border,
            }]}
            onPress={() => setShowTime(true)}>
            <Text style={s.timeBtnIcon}>🕐</Text>
            <Text style={[s.timeBtnText, { color: colors.text }]}>
              {hour}:{minute} {period}
            </Text>
            <Text style={[s.timeBtnHint, { color: colors.muted }]}>
              Tap to change ›
            </Text>
          </TouchableOpacity>

          {/* ─── CATEGORY ──────────────────────────── */}
          <Text style={[s.fieldLabel, { color: colors.muted, marginTop: 24 }]}>
            CATEGORY
          </Text>
          <View style={s.catRow}>
            {CATEGORIES.map(c => {
              const active = category === c.label
              return (
                <TouchableOpacity
                  key={c.label}
                  style={[s.catChip, {
                    borderColor:     active ? c.color : colors.border,
                    backgroundColor: active ? c.color + '22' : colors.card,
                  }]}
                  onPress={() => setCategory(c.label)}>
                  <Text style={s.catIcon}>{c.icon}</Text>
                  <Text style={[s.catLabel, {
                    color: active ? c.color : colors.muted
                  }]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* ─── REPEAT ────────────────────────────── */}
          <Text style={[s.fieldLabel, { color: colors.muted, marginTop: 24 }]}>
            REPEAT
          </Text>
          <View style={s.repeatRow}>
            {['None','Daily','Weekly','Monthly'].map(r => (
              <TouchableOpacity
                key={r}
                style={[s.repeatChip, {
                  borderColor:     repeat === r ? primary : colors.border,
                  backgroundColor: repeat === r ? primaryLight : colors.card,
                }]}
                onPress={() => onRepeatChange(r)}>
                <Text style={[s.repeatLabel, {
                  color: repeat === r ? primary : colors.muted
                }]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ─── REMINDER DAYS (inline) ─────────────── */}
          {repeat !== 'None' && (
            <View style={s.daysSection}>
              <Text style={[s.daysInfo, { color: primary }]}>
                {repeat === 'Daily'
                  ? '📅 Every selected day'
                  : repeat === 'Weekly'
                  ? '📅 Same days every week'
                  : '📅 Same days every month'}
              </Text>

              {/* Presets */}
              <View style={s.presetRow}>
                {PRESETS.map(p => (
                  <TouchableOpacity
                    key={p.label}
                    style={[s.presetChip, {
                      borderColor:     preset === p.label ? primary : colors.border,
                      backgroundColor: preset === p.label ? primaryLight : 'transparent',
                    }]}
                    onPress={() => pickPreset(p)}>
                    <Text style={[s.presetLabel, {
                      color: preset === p.label ? primary : colors.muted
                    }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Day buttons */}
              <View style={s.dayRow}>
                {DAYS.map(d => {
                  const on = days.includes(d)
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[s.dayBtn, {
                        backgroundColor: on ? primary : colors.card,
                        borderColor:     on ? primary : colors.border,
                      }]}
                      onPress={() => toggleDay(d)}>
                      <Text style={[s.dayLabel, {
                        color: on ? '#fff' : colors.muted
                      }]}>
                        {d.slice(0,2)}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {days.length > 0 && (
                <Text style={[s.daysSummary, { color: primary }]}>
                  ✅ {days.join(' · ')}
                </Text>
              )}
            </View>
          )}

          {/* ─── SAVE ──────────────────────────────── */}
          <TouchableOpacity
            style={[s.saveBtn, {
              backgroundColor: saving ? colors.muted : primary
            }]}
            onPress={save}
            disabled={saving}
            activeOpacity={0.8}>
            <Text style={s.saveTxt}>
              {saving ? 'Saving...' : 'Save Plan'}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* ── TIME PICKER ── */}
      <Modal visible={showTime} transparent animationType="slide">
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setShowTime(false)}>
          <TouchableOpacity
            activeOpacity={1}
            style={[s.sheet, { backgroundColor: colors.card }]}>

            <View style={s.sheetHandle}/>
            <Text style={[s.sheetTitle, { color: colors.text }]}>
              Set Time
            </Text>

            <View style={s.pickerRow}>
              {/* Hour */}
              <View style={s.pickerCol}>
                <Text style={[s.colHead, { color: colors.muted }]}>HR</Text>
                <ScrollView
                  style={s.pickerScroll}
                  showsVerticalScrollIndicator={false}>
                  {HOURS.map(h => (
                    <TouchableOpacity
                      key={h}
                      style={[s.pickerItem,
                        h === hour && { backgroundColor: primary + '22' }
                      ]}
                      onPress={() => setHour(h)}>
                      <Text style={[s.pickerTxt, {
                        color:      h === hour ? primary : colors.text,
                        fontWeight: h === hour ? '700' : '400',
                      }]}>
                        {h}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Minute */}
              <View style={s.pickerCol}>
                <Text style={[s.colHead, { color: colors.muted }]}>MIN</Text>
                <ScrollView
                  style={s.pickerScroll}
                  showsVerticalScrollIndicator={false}>
                  {MINUTES.map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[s.pickerItem,
                        m === minute && { backgroundColor: primary + '22' }
                      ]}
                      onPress={() => setMinute(m)}>
                      <Text style={[s.pickerTxt, {
                        color:      m === minute ? primary : colors.text,
                        fontWeight: m === minute ? '700' : '400',
                      }]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Period */}
              <View style={s.pickerCol}>
                <Text style={[s.colHead, { color: colors.muted }]}>AM/PM</Text>
                {PERIODS.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[s.pickerItem,
                      p === period && { backgroundColor: primary + '22' }
                    ]}
                    onPress={() => setPeriod(p)}>
                    <Text style={[s.pickerTxt, {
                      color:      p === period ? primary : colors.text,
                      fontWeight: p === period ? '700' : '400',
                    }]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview */}
            <Text style={[s.timePreview, { color: primary }]}>
              {hour}:{minute} {period}
            </Text>

            <TouchableOpacity
              style={[s.doneBtn, { backgroundColor: primary }]}
              onPress={() => setShowTime(false)}>
              <Text style={s.doneTxt}>Confirm</Text>
            </TouchableOpacity>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  screen:        { flex: 1 },
  header:        {
    flexDirection:       'row',
    alignItems:          'center',
    gap:                 14,
    paddingHorizontal:   24,
    paddingTop:          56,
    paddingBottom:       28,
    borderBottomLeftRadius:  28,
    borderBottomRightRadius: 28,
  },
  back:          { color: '#fff', fontSize: 24, fontWeight: '700' },
  headerTitle:   { color: '#fff', fontSize: 20, fontWeight: '800' },

  body:          { padding: 24, paddingBottom: 64 },

  fieldLabel:    {
    fontSize:      11,
    fontWeight:    '700',
    letterSpacing: 0.8,
    marginBottom:  10,
  },

  // Title
  titleInput:    {
    borderWidth:  1.5,
    borderRadius: 14,
    padding:      16,
    fontSize:     16,
    minHeight:    58,
  },
  warn:          { color: '#FFD166', fontSize: 12, fontWeight: '600', marginTop: 6 },
  hint:          { color: '#06D6A0', fontSize: 12, fontWeight: '600', marginTop: 6 },

  // Time
  timeBtn:       {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            10,
    borderWidth:    1.5,
    borderRadius:   14,
    paddingHorizontal: 16,
    paddingVertical:   14,
  },
  timeBtnIcon:   { fontSize: 18 },
  timeBtnText:   { flex: 1, fontSize: 16, fontWeight: '600' },
  timeBtnHint:   { fontSize: 12 },

  // Category
  catRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catChip:       {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderRadius:   22,
    borderWidth:    1.5,
  },
  catIcon:       { fontSize: 15 },
  catLabel:      { fontWeight: '600', fontSize: 13 },

  // Repeat
  repeatRow:     { flexDirection: 'row', gap: 8 },
  repeatChip:    {
    flex:          1,
    alignItems:    'center',
    paddingVertical: 12,
    borderRadius:  12,
    borderWidth:   1.5,
  },
  repeatLabel:   { fontWeight: '700', fontSize: 12 },

  // Days
  daysSection:   { marginTop: 16 },
  daysInfo:      { fontSize: 13, fontWeight: '600', marginBottom: 14 },
  presetRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  presetChip:    {
    paddingHorizontal: 14,
    paddingVertical:    8,
    borderRadius:  20,
    borderWidth:   1.5,
  },
  presetLabel:   { fontWeight: '600', fontSize: 12 },
  dayRow:        { flexDirection: 'row', gap: 6 },
  dayBtn:        {
    flex:          1,
    alignItems:    'center',
    paddingVertical: 13,
    borderRadius:  10,
    borderWidth:   1.5,
  },
  dayLabel:      { fontSize: 11, fontWeight: '700' },
  daysSummary:   { fontSize: 12, fontWeight: '600', marginTop: 12 },

  // Save
  saveBtn:       {
    marginTop:    32,
    paddingVertical: 17,
    borderRadius: 16,
    alignItems:   'center',
  },
  saveTxt:       { color: '#fff', fontWeight: '800', fontSize: 17 },

  // Modal
  overlay:       {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent:  'flex-end',
  },
  sheet:         {
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    padding:    24,
    paddingBottom: 48,
  },
  sheetHandle:   {
    width:        40,
    height:       4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    alignSelf:    'center',
    marginBottom: 20,
  },
  sheetTitle:    {
    fontSize:    18,
    fontWeight:  '800',
    textAlign:   'center',
    marginBottom: 20,
  },
  pickerRow:     { flexDirection: 'row', gap: 8, marginBottom: 8 },
  pickerCol:     { flex: 1, alignItems: 'center' },
  colHead:       { fontSize: 11, fontWeight: '700', marginBottom: 10 },
  pickerScroll:  { height: 150, width: '100%' },
  pickerItem:    {
    paddingVertical:   10,
    borderRadius:      8,
    alignItems:        'center',
    marginBottom:      2,
  },
  pickerTxt:     { fontSize: 16 },
  timePreview:   {
    fontSize:    30,
    fontWeight:  '800',
    textAlign:   'center',
    marginVertical: 16,
  },
  doneBtn:       {
    paddingVertical: 14,
    borderRadius:    14,
    alignItems:      'center',
  },
  doneTxt:       { color: '#fff', fontWeight: '700', fontSize: 16 },
})