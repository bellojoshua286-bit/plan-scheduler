import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'

const getCategoryIcon = (category) => {
  const icons = {
    Work:'💼', Health:'💪',
    Personal:'🌟', School:'📚', Social:'👥'
  }
  return icons[category] || '📌'
}

export default function Calendar() {
  const [plans,       setPlans]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selectedDay, setSelectedDay] = useState(
    new Date().getDate()
  )
  const router = useRouter()
  const { colors, primary } = useTheme()

  const now            = new Date()
  const year           = now.getFullYear()
  const month          = now.getMonth()
  const monthName      = now.toLocaleString('default', {
    month:'long', year:'numeric'
  })
  const daysInMonth    = new Date(year, month+1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const days           = Array.from(
    {length:daysInMonth}, (_,i) => i+1
  )
  const todayDate      = now.getDate()

  useEffect(() => { fetchMonthPlans() }, [])

  const fetchMonthPlans = async () => {
    const ms = `${year}-${String(month+1).padStart(2,'0')}`
    const { data, error } = await supabase
      .from('plans').select('*')
      .gte('date', `${ms}-01`)
      .lte('date', `${ms}-31`)
    if (!error) setPlans(data || [])
    setLoading(false)
  }

  const selectedDateStr =
    `${year}-${String(month+1).padStart(2,'0')}` +
    `-${String(selectedDay).padStart(2,'0')}`

  const dayPlans = plans.filter(p => p.date === selectedDateStr)

const datesWithPlans = [
  ...new Set(plans.map(p => parseInt(p.date.split('-')[2])))
]

  const toggleDone = async (plan) => {
    const updated = !plan.done
    setPlans(prev =>
      prev.map(p =>
        p.id === plan.id ? {...p, done:updated} : p
      )
    )
    await supabase.from('plans')
      .update({ done:updated })
      .eq('id', plan.id)
  }

  if (loading) return (
    <View style={{
      flex:1, justifyContent:'center',
      alignItems:'center', backgroundColor:colors.bg,
    }}>
      <ActivityIndicator size="large" color={primary}/>
    </View>
  )

  return (
    <ScrollView
      style={[styles.container, {backgroundColor:colors.bg}]}
      showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={[styles.header, {backgroundColor:colors.bg}]}>
        <Text style={[styles.title, {color:colors.text}]}>
          {monthName}
        </Text>
      </View>

      {/* Calendar Card */}
      <View style={[styles.calCard, {
        backgroundColor: colors.card,
        borderColor:     colors.border,
      }]}>

        {/* Day labels row */}
        <View style={styles.dayLabels}>
          {['S','M','T','W','T','F','S'].map((d,i) => (
            <Text key={i} style={[styles.dayLabel,
              {color:colors.muted}]}>
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>

          {/* Empty cells for offset */}
          {Array(firstDayOfWeek).fill(null).map((_,i) => (
            <View key={`empty${i}`} style={styles.gridCell}/>
          ))}

          {/* Day cells */}
          {days.map(d => {
            const isSelected = selectedDay === d
            const isToday    = todayDate === d

            return (
              <TouchableOpacity
                key={d}
                style={[
                  styles.gridCell,
                  isSelected && {
                    backgroundColor: primary,
                    borderRadius: 8,
                  },
                  isToday && !isSelected && {
                    borderWidth:  1.5,
                    borderColor:  primary,
                    borderRadius: 8,
                  },
                ]}
                onPress={() => setSelectedDay(d)}>

                <Text style={[styles.dayNum, {
                  color: isSelected ? '#fff' : colors.text,
                  fontWeight: isSelected ? '700' : '400',
                  textAlign: 'center',
                }]}>
                  {d}
                </Text>

                {datesWithPlans.includes(d) && (
                  <View style={[styles.dot, {
                    backgroundColor: isSelected
                      ? 'rgba(255,255,255,0.8)'
                      : '#FF6B6B',
                  }]}/>
                )}

              </TouchableOpacity>
            )
          })}

        </View>
      </View>

      {/* Day Plans Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, {color:colors.text}]}>
            {monthName.split(' ')[0]} {selectedDay}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/add-plan')}>
            <Text style={[styles.addBtn, {color:primary}]}>
              + Add
            </Text>
          </TouchableOpacity>
        </View>

        {dayPlans.length === 0 ? (
          <View style={[styles.emptyBox, {
            borderColor: colors.border,
          }]}>
            <Text style={{fontSize:32, marginBottom:8}}>
              📭
            </Text>
            <Text style={[styles.emptyText,
              {color:colors.muted}]}>
              No plans for this day
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, {backgroundColor:primary}]}
              onPress={() => router.push('/add-plan')}>
              <Text style={styles.emptyBtnText}>
                Add a Plan
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          dayPlans.map(plan => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, {
                backgroundColor: colors.card,
                borderColor: plan.done
                  ? '#06D6A0' : colors.border,
              }]}
              onPress={() => toggleDone(plan)}>

              <View style={[
                styles.planIcon,
                plan.done && styles.planIconDone,
              ]}>
                <Text style={{fontSize:20}}>
                  {getCategoryIcon(plan.category)}
                </Text>
              </View>

              <View style={{flex:1}}>
                <Text style={[styles.planTitle, {
                  color: plan.done
                    ? colors.muted : colors.text,
                  textDecorationLine: plan.done
                    ? 'line-through' : 'none',
                }]}>
                  {plan.title}
                </Text>
                <Text style={[styles.planMeta,
                  {color:colors.muted}]}>
                  {plan.time}
                  {plan.duration_minutes > 0
                    ? ` · ${plan.duration_minutes}min` : ''}
                  {' · '}{plan.category}
                  {plan.has_alarm ? ' · 🔔' : ''}
                </Text>
              </View>

              <View style={[styles.checkbox, {
                borderColor: plan.done
                  ? '#06D6A0' : colors.border,
                backgroundColor: plan.done
                  ? '#06D6A0' : 'transparent',
              }]}>
                {plan.done && (
                  <Text style={{
                    color:'#fff', fontSize:12, fontWeight:'700',
                  }}>
                    ✓
                  </Text>
                )}
              </View>

            </TouchableOpacity>
          ))
        )}
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:    { flex:1 },
  header:       { padding:24, paddingTop:56 },
  title:        { fontWeight:'800', fontSize:22 },

  calCard:      {
    marginHorizontal: 20,
    borderRadius:     20,
    padding:          16,
    marginBottom:     20,
    borderWidth:      1,
  },

  dayLabels:    { flexDirection:'row', marginBottom:8 },
  dayLabel:     {
    flex:        1,
    textAlign:   'center',
    fontSize:    11,
    fontWeight:  '700',
  },

  grid:         {
    flexDirection: 'row',
    flexWrap:      'wrap',
  },

  // Every cell — empty offset cells and day cells use this
 gridCell: {
  width:          '14.285714%',
  aspectRatio:    1,
  justifyContent: 'center',
  alignItems:     'center',
  padding:        2,
},

  dayNum:       {
    fontSize:   13,
    textAlign:  'center',
  },

  dot:          {
    width:        4,
    height:       4,
    borderRadius: 2,
    marginTop:    2,
  },

  section:      { padding:20 },
  sectionHeader:{
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   12,
  },
  sectionTitle: { fontWeight:'700', fontSize:16 },
  addBtn:       { fontWeight:'700', fontSize:14 },

  emptyBox:     {
    alignItems:   'center',
    padding:      32,
    borderWidth:  1.5,
    borderStyle:  'dashed',
    borderRadius: 16,
  },
  emptyText:    { fontSize:14, marginBottom:12 },
  emptyBtn:     {
    paddingHorizontal: 20,
    paddingVertical:   10,
    borderRadius:      12,
  },
  emptyBtnText: {
    color:      '#fff',
    fontWeight: '700',
    fontSize:   13,
  },

  planCard:     {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    borderRadius:  16,
    padding:       14,
    marginBottom:  10,
    borderWidth:   1,
  },
  planIcon:     {
    width:           44,
    height:          44,
    borderRadius:    12,
    backgroundColor: '#EEF0FF',
    justifyContent:  'center',
    alignItems:      'center',
  },
  planIconDone: {
    backgroundColor: '#06D6A0' + '22',
  },
  planTitle:    { fontWeight:'600', fontSize:14 },
  planMeta:     { fontSize:12, marginTop:2 },
  checkbox:     {
    width:          24,
    height:         24,
    borderRadius:   8,
    borderWidth:    2,
    justifyContent: 'center',
    alignItems:     'center',
  },
})