import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'

const getCategoryIcon = (category) => {
  const icons = {
    Work:'💼', Health:'💪',
    Personal:'🌟', School:'📚', Social:'👥'
  }
  return icons[category] || '📌'
}

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const [plans,      setPlans]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userName,   setUserName]   = useState('')
  const [streak,     setStreak]     = useState(0)
  const [credits,    setCredits]    = useState(200)
  const router  = useRouter()
  const { colors, primary, primaryLight } = useTheme()

  // Refetch every time this screen comes into focus
  useFocusEffect(
  useCallback(() => {
    fetchUserData()
    fetchTodayPlans()
  }, [])
)

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserName(
      user.user_metadata?.full_name?.split(' ')[0] || 'there'
    )
    const { data } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (data) {
      setStreak(data.current_streak || 0)
      setCredits(data.credits || 200)
    }
  }

  const fetchTodayPlans = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('date', today)
      .order('time', { ascending: true })
    if (!error) setPlans(data || [])
    setLoading(false)
    setRefreshing(false)
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchTodayPlans()
  }, [])

  const toggleDone = async (plan) => {
    const updated = !plan.done
    setPlans(prev =>
      prev.map(p =>
        p.id === plan.id ? {...p, done:updated} : p
      )
    )
    await supabase
      .from('plans')
      .update({ done: updated })
      .eq('id', plan.id)
    if (updated) updateStreak()
  }

  const updateStreak = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().split('T')[0]

    const { data } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data?.last_active === today) return

    const newStreak = data?.last_active === yStr
      ? (data.current_streak || 0) + 1 : 1
    const newCredits = (data?.credits || 200) + 10

    await supabase.from('streaks').upsert({
      user_id:        user.id,
      current_streak: newStreak,
      last_active:    today,
      credits:        newCredits,
    })
    setStreak(newStreak)
    setCredits(newCredits)
  }

  const completedCount = plans.filter(p => p.done).length

  if (loading) return (
    <View style={[styles.loading, {backgroundColor:colors.bg}]}>
      <ActivityIndicator size="large" color={primary}/>
    </View>
  )

  return (
    <ScrollView
      style={[styles.container, {backgroundColor:colors.bg}]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={primary}
        />
      }>

      {/* Header */}
      <View style={[styles.header, {backgroundColor:primary}]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()} 👋
            </Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <View style={styles.pills}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                🔥 {streak} days
              </Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>⭐ {credits}</Text>
            </View>
          </View>
        </View>

        {/* Progress box */}
        <View style={styles.progressBox}>
          <View style={styles.progressRing}>
            <Text style={styles.progressFraction}>
              {completedCount}/{plans.length}
            </Text>
          </View>
          <View>
            <Text style={styles.progressTitle}>
              Today's Progress
            </Text>
            <Text style={styles.progressSub}>
              {plans.length - completedCount} tasks remaining
            </Text>
          </View>
        </View>
      </View>

      {/* Plans list */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color:colors.text}]}>
          Today's Plans
        </Text>

        {plans.length === 0 ? (
          <View style={[styles.emptyBox, {
            backgroundColor: colors.card,
            borderColor:     colors.border,
          }]}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={[styles.emptyTitle, {color:colors.text}]}>
              No plans yet today
            </Text>
            <Text style={[styles.emptyText, {color:colors.muted}]}>
              Tap Add a Plan to get started
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, {backgroundColor:primary}]}
              onPress={() => router.push('/add-plan')}>
              <Text style={styles.emptyBtnText}>Add a Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {plans.map(plan => (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, {
                  backgroundColor: colors.card,
                  borderColor:     colors.border,
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
                <View style={styles.planInfo}>
                  <Text style={[styles.planTitle, {
                    color: plan.done ? colors.muted : colors.text,
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
                      color:'#fff', fontSize:12, fontWeight:'700'
                    }}>
                      ✓
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {/* Add more button */}
            <TouchableOpacity
              style={[styles.addMoreBtn, {borderColor:primary}]}
              onPress={() => router.push('/add-plan')}>
              <Text style={[styles.addMoreText, {color:primary}]}>
                + Add another plan
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color:colors.text}]}>
          Categories
        </Text>
        <View style={styles.catGrid}>
          {[
            {label:'Work',    icon:'💼', color:'#5B4FE9',
              desc:'Meetings, tasks'},
            {label:'Health',  icon:'💪', color:'#06D6A0',
              desc:'Gym, meals'},
            {label:'Personal',icon:'🌟', color:'#FF6B6B',
              desc:'Hobbies, goals'},
            {label:'School',  icon:'📚', color:'#FFD166',
              desc:'Study, classes'},
            {label:'Social',  icon:'👥', color:'#FF9F43',
              desc:'Friends, events'},
          ].map(cat => {
            const cp  = plans.filter(p=>p.category===cat.label)
            const cd  = cp.filter(p=>p.done).length
            const pct = cp.length>0 ? (cd/cp.length)*100 : 0
            return (
              <View key={cat.label} style={[styles.catCard, {
                backgroundColor: colors.card,
                borderColor:     colors.border,
              }]}>
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text style={[styles.catLabel,{color:colors.text}]}>
                  {cat.label}
                </Text>
                <Text style={[styles.catDesc,{color:colors.muted}]}>
                  {cat.desc}
                </Text>
                <Text style={[styles.catCount,{color:colors.muted}]}>
                  {cp.length} plans
                </Text>
                <View style={[styles.catBar,
                  {backgroundColor:colors.border}]}>
                  <View style={[styles.catBarFill, {
                    width:           `${pct}%`,
                    backgroundColor: cat.color,
                  }]}/>
                </View>
              </View>
            )
          })}
        </View>
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:        { flex:1 },
  loading:          {
    flex:1, justifyContent:'center', alignItems:'center'
  },
  header:           {
    padding:             24,
    paddingTop:          56,
    borderBottomLeftRadius:  28,
    borderBottomRightRadius: 28,
  },
  headerTop:        {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   20,
  },
  greeting:         {
    color:'rgba(255,255,255,0.75)', fontSize:13
  },
  userName:         {
    color:'#fff', fontSize:22, fontWeight:'800', marginTop:2
  },
  pills:            { flexDirection:'row', gap:8 },
  pill:             {
    backgroundColor:  'rgba(255,255,255,0.2)',
    borderRadius:     20,
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  pillText:         { color:'#fff', fontWeight:'700', fontSize:13 },
  progressBox:      {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius:    16,
    padding:         16,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             14,
  },
  progressRing:     {
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent:  'center',
    alignItems:      'center',
  },
  progressFraction: {
    color:'#fff', fontWeight:'700', fontSize:13
  },
  progressTitle:    {
    color:'#fff', fontWeight:'700', fontSize:15
  },
  progressSub:      {
    color:'rgba(255,255,255,0.75)', fontSize:12, marginTop:2
  },
  section:          { padding:20 },
  sectionTitle:     {
    fontWeight:'700', fontSize:16, marginBottom:14
  },
  emptyBox:         {
    alignItems:  'center',
    padding:     32,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  emptyEmoji:       { fontSize:40, marginBottom:12 },
  emptyTitle:       {
    fontWeight:'700', fontSize:16, marginBottom:4
  },
  emptyText:        { fontSize:14, marginBottom:16 },
  emptyBtn:         {
    paddingHorizontal: 24,
    paddingVertical:   12,
    borderRadius:      12,
  },
  emptyBtnText:     {
    color:'#fff', fontWeight:'700', fontSize:14
  },
  planCard:         {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    borderRadius:  16,
    padding:       14,
    marginBottom:  10,
    borderWidth:   1,
  },
  planIcon:         {
    width:           44,
    height:          44,
    borderRadius:    12,
    backgroundColor: '#EEF0FF',
    justifyContent:  'center',
    alignItems:      'center',
  },
  planIconDone:     { backgroundColor:'#06D6A0'+'22' },
  planInfo:         { flex:1 },
  planTitle:        { fontWeight:'600', fontSize:14 },
  planMeta:         { fontSize:12, marginTop:2 },
  checkbox:         {
    width:          24,
    height:         24,
    borderRadius:   8,
    borderWidth:    2,
    justifyContent: 'center',
    alignItems:     'center',
  },
  addMoreBtn:       {
    borderWidth:  1.5,
    borderStyle:  'dashed',
    borderRadius: 14,
    padding:      14,
    alignItems:   'center',
    marginTop:    4,
  },
  addMoreText:      { fontWeight:'600', fontSize:14 },
  catGrid:          {
    flexDirection: 'row', flexWrap:'wrap', gap:12
  },
  catCard:          {
    width:        '47%',
    borderRadius: 16,
    padding:      14,
    borderWidth:  1,
  },
  catIcon:          { fontSize:24, marginBottom:6 },
  catLabel:         { fontWeight:'700', fontSize:14 },
  catDesc:          { fontSize:11, marginTop:2, marginBottom:6 },
  catCount:         { fontSize:11, marginBottom:6 },
  catBar:           { height:4, borderRadius:2 },
  catBarFill:       { height:'100%', borderRadius:2 },
})