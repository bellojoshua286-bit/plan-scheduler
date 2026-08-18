import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, Alert
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { useTheme, THEMES } from '../../context/ThemeContext'

export default function Progress() {
  const [streak,   setStreak]   = useState(0)
  const [credits,  setCredits]  = useState(200)
  const [loading,  setLoading]  = useState(true)
  const [plans,    setPlans]    = useState([])
  const [purchased,setPurchased]= useState(['Default'])
  const [userId,   setUserId]   = useState(null)

  const {
    colors, primary, dark,
    activeTheme, setActiveTheme
  } = useTheme()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: sd } = await supabase
      .from('streaks').select('*')
      .eq('user_id', user.id).single()

    if (sd) {
      setStreak(sd.current_streak || 0)
      setCredits(sd.credits || 200)
      setPurchased(sd.purchased_themes?.length
        ? sd.purchased_themes : ['Default'])
    }

    const now      = new Date()
    const monday   = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1)
    const weekStart = monday.toISOString().split('T')[0]

    const { data: pd } = await supabase
      .from('plans').select('*').gte('date', weekStart)
    if (pd) setPlans(pd)
    setLoading(false)
  }

  const buyTheme = async (themeKey, cost) => {
    if (credits < cost) {
      Alert.alert('Not enough credits',
        `You need ${cost} credits. ` +
        `You have ${credits}. Keep your streak going!`)
      return
    }
    if (purchased.includes(themeKey)) {
      // Already owned — just activate it
      setActiveTheme(themeKey)
      return
    }
    const newCredits  = credits - cost
    const newPurchased = [...purchased, themeKey]
    setCredits(newCredits)
    setPurchased(newPurchased)
    setActiveTheme(themeKey)

    await supabase.from('streaks').update({
      credits:           newCredits,
      purchased_themes:  newPurchased,
      active_theme:      themeKey,
    }).eq('user_id', userId)

    Alert.alert('Theme Unlocked! 🎨',
      `${THEMES[themeKey].name} is now active!`)
  }

  const activateTheme = async (themeKey) => {
    setActiveTheme(themeKey)
    await supabase.from('streaks')
      .update({ active_theme: themeKey })
      .eq('user_id', userId)
  }

  const SHOP_ITEMS = [
    { key:'Ocean',      cost:50,  emoji:'🌊',
      desc:'Calm ocean blues' },
    { key:'Forest',     cost:50,  emoji:'🌿',
      desc:'Refreshing forest greens' },
    { key:'Sunset',     cost:80,  emoji:'🌅',
      desc:'Warm sunset oranges' },
    { key:'PurpleDusk', cost:80,  emoji:'🌌',
      desc:'Deep royal purple' },
    { key:'Midnight',   cost:100, emoji:'🌙',
      desc:'Sleek dark midnight' },
  ]

  const getWeekData = () => {
    return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
      .map((day, i) => {
        const date = new Date()
        const diff = i-(date.getDay()===0
          ? 6 : date.getDay()-1)
        const d = new Date(date)
        d.setDate(d.getDate()+diff)
        const ds = d.toISOString().split('T')[0]
        return {
          day,
          count: plans.filter(p=>p.date===ds&&p.done).length
        }
      })
  }

  const weekData   = getWeekData()
  const maxCount   = Math.max(...weekData.map(d=>d.count),1)
  const weekTotal  = weekData.reduce((s,d)=>s+d.count,0)
  const completion = plans.length > 0
    ? Math.round((weekTotal/plans.length)*100) : 0

  if (loading) return (
    <View style={{flex:1,justifyContent:'center',
      alignItems:'center',backgroundColor:colors.bg}}>
      <ActivityIndicator size="large" color={primary}/>
    </View>
  )

  return (
    <ScrollView
      style={[styles.container,{backgroundColor:colors.bg}]}
      showsVerticalScrollIndicator={false}>

      <View style={[styles.header,{backgroundColor:colors.bg}]}>
        <Text style={[styles.title,{color:colors.text}]}>
          Your Progress
        </Text>
      </View>

      {/* Streak */}
      <View style={styles.streakCard}>
        <Text style={styles.streakLabel}>Current Streak</Text>
        <View style={styles.streakRow}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakNum}>{streak}</Text>
            <Text style={styles.streakSub}>days in a row</Text>
          </View>
        </View>
        <View style={styles.streakNote}>
          <Text style={styles.streakNoteText}>
            🎯 Complete today's plans to keep your streak!
          </Text>
        </View>
      </View>

      {/* Credits */}
      <View style={[styles.card,{
        backgroundColor:colors.card,
        borderColor:colors.border,
      }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.cardTitle,{color:colors.text}]}>
              Credits
            </Text>
            <Text style={[styles.cardSub,{color:colors.muted}]}>
              Earn 10 per streak day
            </Text>
          </View>
          <Text style={{fontSize:24}}>⭐</Text>
        </View>
        <Text style={[styles.creditNum,{color:colors.text}]}>
          {credits}
        </Text>
        <View style={[styles.creditBar,
          {backgroundColor:colors.border}]}>
          <View style={[styles.creditBarFill,{
            width:`${Math.min((credits/300)*100,100)}%`,
            backgroundColor:primary,
          }]}/>
        </View>
      </View>

      {/* Theme Shop */}
      <View style={[styles.card,{
        backgroundColor:colors.card,
        borderColor:colors.border,
      }]}>
        <Text style={[styles.cardTitle,{
          color:colors.text, marginBottom:4
        }]}>
          🎨 Theme Shop
        </Text>
        <Text style={[styles.cardSub,{
          color:colors.muted, marginBottom:16
        }]}>
          Buy themes with credits. Active theme changes
          the entire app's colour scheme.
        </Text>

        {/* Default theme always available */}
        <TouchableOpacity
          style={[styles.themeRow,{borderColor:colors.border}]}
          onPress={() => activateTheme('Default')}>
          <View style={[styles.themeColorDot,
            {backgroundColor:'#5B4FE9'}]}/>
          <View style={{flex:1}}>
            <Text style={[styles.themeName,{color:colors.text}]}>
              Default Purple
            </Text>
            <Text style={[styles.themeDesc,{color:colors.muted}]}>
              The original Plan Scheduler look
            </Text>
          </View>
          <View style={[styles.themeStatus,{
            backgroundColor: activeTheme==='Default'
              ? '#06D6A0' : colors.border
          }]}>
            <Text style={{
              color: activeTheme==='Default'
                ? '#fff' : colors.muted,
              fontSize:11, fontWeight:'700',
            }}>
              {activeTheme==='Default' ? 'Active' : 'Free'}
            </Text>
          </View>
        </TouchableOpacity>

        {SHOP_ITEMS.map(item => {
          const owned  = purchased.includes(item.key)
          const active = activeTheme === item.key
          const canBuy = credits >= item.cost
          const t      = THEMES[item.key]
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.themeRow,{
                borderColor: active
                  ? primary : colors.border,
                backgroundColor: active
                  ? primary+'11' : 'transparent',
              }]}
              onPress={() => buyTheme(item.key, item.cost)}>
              <View style={[styles.themeColorDot,
                {backgroundColor:t.primary}]}/>
              <View style={{flex:1}}>
                <Text style={[styles.themeNameRow]}>
                  <Text style={[styles.themeEmoji]}>
                    {item.emoji}{' '}
                  </Text>
                  <Text style={[styles.themeNameText,
                    {color:colors.text}]}>
                    {t.name}
                  </Text>
                </Text>
                <Text style={[styles.themeDesc,
                  {color:colors.muted}]}>
                  {item.desc}
                </Text>
              </View>
              <View style={[styles.themeStatus,{
                backgroundColor: active
                  ? '#06D6A0'
                  : owned ? primary
                  : canBuy ? primary+'33'
                  : colors.border,
              }]}>
                <Text style={{
                  color: active||owned ? '#fff' : colors.muted,
                  fontSize:11, fontWeight:'700',
                }}>
                  {active ? 'Active'
                    : owned ? 'Apply'
                    : `⭐${item.cost}`}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}

        <View style={[styles.themeHint,
          {backgroundColor:primary+'11'}]}>
          <Text style={[styles.themeHintText,{color:primary}]}>
            💡 Tap any owned theme to apply it instantly.
            Buy new ones with your credits.
          </Text>
        </View>
      </View>

      {/* Weekly Chart */}
      <View style={[styles.card,{
        backgroundColor:colors.card,
        borderColor:colors.border,
        marginBottom:32,
      }]}>
        <Text style={[styles.cardTitle,{color:colors.text}]}>
          This Week
        </Text>
        <View style={styles.barChart}>
          {weekData.map(({day,count}) => (
            <View key={day} style={styles.barCol}>
              <Text style={[styles.barCount,{color:colors.muted}]}>
                {count>0?count:''}
              </Text>
              <View style={[styles.barTrack,
                {backgroundColor:colors.border}]}>
                <View style={[styles.barFill,{
                  height:`${(count/maxCount)*100}%`,
                  backgroundColor:count>0
                    ? primary : colors.border,
                }]}/>
              </View>
              <Text style={[styles.barLabel,{color:colors.muted}]}>
                {day}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.statsRow}>
          {[
            [weekTotal, 'Done'],
            [`${completion}%`, 'Completion'],
            [streak, 'Streak'],
          ].map(([v,l]) => (
            <View key={l} style={styles.stat}>
              <Text style={[styles.statNum,{color:colors.text}]}>
                {v}
              </Text>
              <Text style={[styles.statLabel,{color:colors.muted}]}>
                {l}
              </Text>
            </View>
          ))}
        </View>
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:      { flex:1 },
  header:         { padding:24, paddingTop:56 },
  title:          { fontWeight:'800', fontSize:22 },
  streakCard:     {
    marginHorizontal:20, marginBottom:16,
    borderRadius:20, padding:24,
    backgroundColor:'#FF6B6B',
  },
  streakLabel:    { color:'rgba(255,255,255,0.85)', fontSize:13 },
  streakRow:      {
    flexDirection:'row', alignItems:'center',
    gap:12, marginTop:8,
  },
  streakEmoji:    { fontSize:48 },
  streakNum:      {
    color:'#fff', fontSize:40,
    fontWeight:'800', lineHeight:44,
  },
  streakSub:      {
    color:'rgba(255,255,255,0.85)', fontSize:13
  },
  streakNote:     {
    backgroundColor:'rgba(255,255,255,0.2)',
    borderRadius:8, padding:10, marginTop:16,
  },
  streakNoteText: { color:'#fff', fontSize:13 },
  card:           {
    marginHorizontal:20, marginBottom:16,
    borderRadius:20, padding:20, borderWidth:1,
  },
  cardHeader:     {
    flexDirection:'row', justifyContent:'space-between',
    alignItems:'center', marginBottom:12,
  },
  cardTitle:      { fontWeight:'700', fontSize:16 },
  cardSub:        { fontSize:12, marginTop:2 },
  creditNum:      {
    fontSize:36, fontWeight:'800', marginBottom:8
  },
  creditBar:      {
    height:8, borderRadius:4, marginBottom:4,
  },
  creditBarFill:  { height:'100%', borderRadius:4 },

  // Theme shop
  themeRow:       {
    flexDirection:'row', alignItems:'center',
    gap:12, paddingVertical:12,
    borderBottomWidth:1, paddingHorizontal:4,
  },
  themeColorDot:  {
    width:28, height:28, borderRadius:14,
  },
  themeNameRow:   { flexDirection:'row', alignItems:'center' },
  themeEmoji:     { fontSize:14 },
  themeNameText:  { fontWeight:'600', fontSize:14 },
  themeNameTxt:   { fontWeight:'600', fontSize:14 },
  themeDesc:      { fontSize:12, marginTop:2 },
  themeStatus:    {
    paddingHorizontal:10, paddingVertical:5,
    borderRadius:10,
  },
  themeHint:      {
    marginTop:12, padding:10, borderRadius:10,
  },
  themeHintText:  { fontSize:12, fontWeight:'600' },
  themeName:      { fontWeight:'600', fontSize:14 },

  // Chart
  barChart:       {
    flexDirection:'row', height:100,
    gap:8, marginBottom:16, marginTop:12,
  },
  barCol:         { flex:1, alignItems:'center' },
  barCount:       { fontSize:10, marginBottom:4 },
  barTrack:       {
    flex:1, width:'100%',
    borderRadius:6, justifyContent:'flex-end',
    overflow:'hidden',
  },
  barFill:        { width:'100%', borderRadius:6 },
  barLabel:       {
    fontSize:10, marginTop:4, fontWeight:'600'
  },
  statsRow:       {
    flexDirection:'row', justifyContent:'space-around',
    marginTop:8,
  },
  stat:           { alignItems:'center' },
  statNum:        { fontWeight:'700', fontSize:20 },
  statLabel:      { fontSize:11, marginTop:2 },
})