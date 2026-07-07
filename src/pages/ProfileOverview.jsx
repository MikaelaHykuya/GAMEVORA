import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useFriends } from '../contexts/FriendsContext'
import { useToast } from '../contexts/ToastContext'
import { useBgm } from '../contexts/BgmContext'
import { formatRupiah, getAvatarUrl, EFFECT_CONFIG } from '../lib/utils'
import AvatarView from '../components/AvatarView'
import { themeClasses } from '../config/themes'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import { Helmet } from 'react-helmet-async'

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setValue(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return value
}

function Particles({ effectKey }) {
  if (!effectKey || effectKey === 'none') return null
  const configs = {
    fire: { count: 8, size: [2, 5], colors: ['#ff4500', '#ff8c00', '#ffd700'], anim: 'particleRise', dur: [1.5, 3] },
    lightning: { count: 6, size: [1, 3], colors: ['#00d4ff', '#ffffff', '#7b2ff7'], anim: 'particleStreak', dur: [0.3, 0.8] },
    water: { count: 6, size: [3, 6], colors: ['rgba(0,180,219,0.5)', 'rgba(0,131,176,0.4)', 'rgba(125,211,252,0.3)'], anim: 'particleBubble', dur: [2, 4] },
    ice: { count: 8, size: [2, 4], colors: ['#e0f7fa', '#80deea', '#ffffff'], anim: 'particleSnow', dur: [2, 4] },
    neon: { count: 6, size: [2, 4], colors: ['#a855f7', '#ec4899', '#6366f1'], anim: 'particleFloat', dur: [2, 4] },
    rainbow: { count: 8, size: [2, 4], colors: ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff'], anim: 'particleFloat', dur: [1.5, 3] },
    galaxy: { count: 10, size: [1, 3], colors: ['#4a00e0', '#8b5cf6', '#ec4899', '#ffffff'], anim: 'particleTwinkle', dur: [1, 3] },
    lava: { count: 8, size: [2, 5], colors: ['#8b0000', '#ff4500', '#ffd700'], anim: 'particleRise', dur: [1.5, 3.5] },
    ocean: { count: 6, size: [3, 6], colors: ['rgba(0,119,190,0.4)', 'rgba(0,180,219,0.3)', 'rgba(0,26,51,0.5)'], anim: 'particleBubble', dur: [2.5, 5] },
  }
  const cfg = configs[effectKey] || configs.fire
  const parts = []
  for (let i = 0; i < cfg.count; i++) {
    const size = cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0])
    const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)]
    const delay = Math.random() * 3
    const dur = cfg.dur[0] + Math.random() * (cfg.dur[1] - cfg.dur[0])
    const left = 5 + Math.random() * 90
    parts.push(
      <div key={i} className="absolute pointer-events-none"
        style={{
          width: size, height: size, left: `${left}%`,
          bottom: cfg.anim === 'particleSnow' ? 'auto' : '-5px',
          top: cfg.anim === 'particleSnow' ? '-5px' : 'auto',
          backgroundColor: color,
          borderRadius: cfg.anim === 'particleStreak' ? '2px' : '50%',
          animation: `${cfg.anim} ${dur}s ease-out ${delay}s infinite`,
          opacity: 0,
        }}
      />
    )
  }
  return <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">{parts}</div>
}

function BgEffect({ type }) {
  if (!type || type === 'none') return null
  if (type === 'matrix') {
    const cols = []
    for (let i = 0; i < 20; i++) {
      cols.push(
        <div key={i} className="absolute text-[10px] font-mono text-green-500/30 pointer-events-none select-none"
          style={{
            left: `${i * 5}%`, top: '-10%',
            animation: `matrixDrop ${2 + Math.random() * 3}s linear ${Math.random() * 3}s infinite`,
            writingMode: 'vertical-rl',
          }}>
          {String.fromCharCode(0x30A0 + Math.random() * 96)}
        </div>
      )
    }
    return <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">{cols}</div>
  }
  if (type === 'stars') {
    const stars = []
    for (let i = 0; i < 50; i++) {
      stars.push(
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{
            width: 1 + Math.random() * 2, height: 1 + Math.random() * 2,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            animation: `starTwinkle ${1 + Math.random() * 3}s ease-in-out ${Math.random() * 3}s infinite`,
          }}
        />
      )
    }
    return <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">{stars}</div>
  }
  if (type === 'aurora') {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {['from-green-500/10 via-teal-500/5', 'from-purple-500/10 via-pink-500/5', 'from-blue-500/10 via-cyan-500/5'].map((c, i) => (
          <div key={i} className={`absolute top-0 h-32 w-[200%] bg-gradient-to-r ${c} to-transparent pointer-events-none`}
            style={{
              animation: `auroraWave ${6 + i * 2}s ease-in-out ${i * 2}s infinite`,
              top: `${20 + i * 15}%`,
            }}
          />
        ))}
      </div>
    )
  }
  return null
}

function HoverSound() {
  const audioCtx = useRef(null)
  const playSound = useCallback(() => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioCtx.current.createOscillator()
    const gain = audioCtx.current.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.current.destination)
    osc.frequency.value = 800 + Math.random() * 400
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.03, audioCtx.current.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.1)
    osc.start()
    osc.stop(audioCtx.current.currentTime + 0.1)
  }, [])
  return playSound
}

function Badge({ label, emoji, earned, color, requirement, current, target }) {
  const [showTip, setShowTip] = useState(false)
  return (
    <div className="relative"
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}>
      <div className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-all cursor-default ${earned ? 'border-white/[0.08] bg-white/[0.03]' : 'border-white/[0.03] opacity-30'}`}>
        <span className={`text-base ${earned ? 'badge-glow' : ''}`} style={earned ? { color } : {}}>{emoji}</span>
        <span className="text-[6px] font-black uppercase tracking-widest text-gray-500 text-center leading-tight px-1">{label}</span>
      </div>
      {showTip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 z-50 pointer-events-none">
          <div className="bg-zinc-800 border border-white/[0.08] rounded-xl p-3 shadow-xl backdrop-blur-xl">
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: color || '#a855f7' }}>{emoji} {label}</p>
            <p className="text-[7px] text-gray-400 mt-1 leading-relaxed">{requirement}</p>
            {!earned && (
              <div className="mt-2">
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${Math.min((current / target) * 100, 100)}%`, background: color }} />
                </div>
                <p className="text-[6px] text-gray-600 font-black uppercase tracking-widest mt-1">{current}/{target}</p>
              </div>
            )}
            {earned && <p className="text-[7px] text-green-400 font-black uppercase tracking-widest mt-1">✓ Unlocked</p>}
          </div>
          <div className="w-2 h-2 bg-zinc-800 border-r border-b border-white/[0.08] rotate-45 mx-auto -mt-1" />
        </div>
      )}
    </div>
  )
}

export default function ProfileOverview() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)

  const [libraryCount, setLibraryCount] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [totalSpending, setTotalSpending] = useState(0)
  const [videoMuted, setVideoMuted] = useState(true)
  const [counted, setCounted] = useState(false)
  const [recentActivity, setRecentActivity] = useState([])
  const [monthlySpending, setMonthlySpending] = useState([])
  const [featuredGames, setFeaturedGames] = useState([])
  const [visitorCount, setVisitorCount] = useState(0)
  const [visitorMessages, setVisitorMessages] = useState([])
  const [visitMessage, setVisitMessage] = useState('')
  const [sendingVisit, setSendingVisit] = useState(false)
  const { loadExternalBgm, stopBgm } = useBgm()
  const playSound = HoverSound()

  const isOtherProfileRef = useRef(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    init()
    return () => {
      if (isOtherProfileRef.current) stopBgm()
    }
  }, [user])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function init() {
    const [approvedCountRes, approvedLib, allLibRes, activityRes] = await Promise.all([
      supabase.from('library').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'approved'),
      supabase.from('library').select('id, games(price, discount_price, title, thumbnail), created_at').eq('user_id', user.id).eq('status', 'approved').order('created_at', { ascending: false }).limit(10),
      supabase.from('library').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('library').select('id, games(title), created_at, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    ])

    setLibraryCount(approvedCountRes.count || 0)
    setOrderCount(allLibRes.count || 0)
    setTotalSpending(
      (approvedLib.data || []).reduce((acc, curr) => acc + (Number(curr.games?.discount_price || curr.games?.price) || 0), 0)
    )

    if (activityRes.data) {
      setRecentActivity(activityRes.data.map(a => ({
        text: a.status === 'approved' ? `Purchased ${a.games?.title || 'a game'}` : `Ordered ${a.games?.title || 'a game'}`,
        time: a.created_at,
        type: a.status === 'approved' ? 'purchase' : 'order',
      })))
    }

    const monthly = {}
    ;(approvedLib.data || []).forEach(item => {
      if (item.created_at) {
        const m = new Date(item.created_at).toLocaleString('en-US', { month: 'short', year: '2-digit' })
        monthly[m] = (monthly[m] || 0) + (Number(item.games?.discount_price || item.games?.price) || 0)
      }
    })
    setMonthlySpending(Object.entries(monthly).slice(-6).map(([m, v]) => ({ month: m, value: v })))

    if (profile?.featured_games?.length) {
      const { data: games } = await supabase.from('games').select('id, title, thumbnail').in('id', profile.featured_games)
      setFeaturedGames(games || [])
    }

    // Visitor count
    if (profile && user && profile.id !== user.id) {
      const visitedKey = `visited_profile_${profile.id}`
      if (!localStorage.getItem(visitedKey)) {
        await supabase.from('profiles').update({ visitor_count: (profile.visitor_count || 0) + 1 }).eq('id', profile.id)
        localStorage.setItem(visitedKey, Date.now().toString())
        setVisitorCount((profile.visitor_count || 0) + 1)
      } else {
        setVisitorCount(profile.visitor_count || 0)
      }
    } else if (profile) {
      setVisitorCount(profile.visitor_count || 0)
    }

    // Auto-play BGM when viewing another user's profile
    if (profile && user && profile.id !== user.id) {
      isOtherProfileRef.current = true
      const url = profile.bgm_playlist?.[0]?.url || profile.bgm_url
      if (url) loadExternalBgm(url)
    } else {
      isOtherProfileRef.current = false
    }

    // Load visitor messages
    if (profile) {
      const { data: visits } = await supabase
        .from('profile_visits')
        .select('*, visitor:visitor_id(id, full_name, username, avatar_url)')
        .eq('visited_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setVisitorMessages(visits || [])
    }

    setTimeout(() => setCounted(true), 100)
  }



  const effectKey = profile?.border_effect || 'none'
  const hasEffect = effectKey !== 'none'
  const cfg = EFFECT_CONFIG[effectKey] || null
  const bgEffectType = profile?.bg_effect || 'none'
  const th = themeClasses(profile?.profile_theme || 'default')

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Vault Hunter'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const level = Math.min(libraryCount + 1, 50)
  const xpPerLevel = 5
  const currentXp = libraryCount % xpPerLevel
  const xpProgress = (currentXp / xpPerLevel) * 100

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown'

  const badges = [
    { label: 'First Buy', emoji: '🛒', earned: libraryCount >= 1, color: '#f59e0b', requirement: 'Make your first purchase', current: libraryCount, target: 1 },
    { label: 'Collector', emoji: '📦', earned: libraryCount >= 10, color: '#8b5cf6', requirement: 'Collect 10 games in your library', current: libraryCount, target: 10 },
    { label: 'Veteran', emoji: '⚔', earned: libraryCount >= 25, color: '#ef4444', requirement: 'Own 25 games or more', current: libraryCount, target: 25 },
    { label: 'Elite', emoji: '👑', earned: libraryCount >= 50, color: '#fbbf24', requirement: 'Reach 50 games in collection', current: libraryCount, target: 50 },
    { label: 'Explorer', emoji: '🧭', earned: orderCount >= 10, color: '#3b82f6', requirement: 'Place 10 total orders', current: orderCount, target: 10 },
  ]

  const countedOrders = useCountUp(counted ? orderCount : 0)
  const countedSpending = useCountUp(counted ? totalSpending : 0)
  const countedCollection = useCountUp(counted ? libraryCount : 0)

  const maxChartValue = Math.max(...monthlySpending.map(s => s.value), 1)

  const [activeModal, setActiveModal] = useState(null)

  const navCards = [
    { key: 'games', to: '/profile/collection', label: 'My Games', count: libraryCount, desc: 'Your game library', bg: 'from-purple-600 to-purple-500', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { key: 'wishlist', to: '/profile/wishlist', label: 'Wishlist', count: null, desc: 'Games you want', bg: 'from-pink-600 to-pink-500', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' },
    { key: 'orders', to: '/profile/orders', label: 'Orders', count: orderCount, desc: 'Purchase history', bg: 'from-blue-600 to-blue-500', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { key: 'activity', modal: true, label: 'Activity', count: null, desc: 'Recent purchases & orders', bg: 'from-teal-600 to-teal-500', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { key: 'chart', modal: true, label: 'Spending', count: null, desc: 'Monthly spending chart', bg: 'from-cyan-600 to-cyan-500', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { key: 'achievements', modal: true, label: 'Achievements', count: badges.filter(b => b.earned).length, desc: 'Badges & milestones', bg: 'from-amber-600 to-amber-500', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { key: 'featured', modal: true, label: 'Featured', count: featuredGames.length, desc: 'Your featured games', bg: 'from-yellow-600 to-yellow-500', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { key: 'voucher', to: '/affiliate', label: 'Kode Voucher', count: null, desc: 'Redeem & share codes', bg: 'from-green-600 to-emerald-500', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { key: 'settings', to: '/profile/settings', label: 'Settings', count: null, desc: 'Customize your profile', bg: 'from-gray-600 to-gray-500', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ]

  return (
    <div className={`min-h-screen ${th.container} text-white`}>
      <Helmet><title>GVR - Profile</title><meta name="description" content="Your GameVora profile overview" /></Helmet>
      <BgEffect type={bgEffectType} />

      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] bg-blue-600/5 rounded-full blur-[100px] animate-float" />
      </div>

      <Navbar />
      <BottomNav />

      <main className="relative z-10 pt-28 px-4 md:px-6 max-w-5xl mx-auto pb-32">

        <div className="relative mb-8" onMouseEnter={playSound}>
          <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 via-transparent to-transparent rounded-[32px]" />
          {(() => {
            const card = (
              <div className="relative bg-zinc-900/60 border border-white/[0.04] rounded-[32px] overflow-hidden backdrop-blur-xl">
                <div className="relative h-32 md:h-40 overflow-hidden"
                  style={hasEffect && cfg ? { background: `linear-gradient(135deg, ${cfg.glow}33, transparent 70%)` } : {}}>
                  {!hasEffect && <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 via-blue-900/20 to-purple-900/40" />}
                  {profile?.cover_video_url ? (
                    <video src={profile.cover_video_url} autoPlay loop playsInline muted={videoMuted}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      style={{ transform: `translateY(${scrollY * 0.05}px)` }} />
                  ) : profile?.cover_url ? (
                    <img src={profile.cover_url} alt="cover"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ transform: `translateY(${scrollY * 0.05}px)` }} />
                  ) : null}
                  <Particles effectKey={effectKey} />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)] pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none" />
                  {profile?.cover_video_url && (
                    <button onClick={(e) => { e.stopPropagation(); setVideoMuted(!videoMuted) }}
                      className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-all z-30 pointer-events-auto">
                      {videoMuted ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                <div className="px-6 md:px-8 pb-6 -mt-16 relative z-20">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="flex items-end gap-5">
                      <div className="relative" style={hasEffect && cfg ? { '--avatar-glow': cfg.shadow } : {}}>
                        <div className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-[3px] bg-zinc-800 ${hasEffect ? '' : 'shadow-[0_0_30px_rgba(168,85,247,0.3)]'}`}
                          style={hasEffect && cfg ? {
                            boxShadow: `0 0 25px ${cfg.shadow}, 0 0 50px ${cfg.glow}33`,
                            animation: 'avatarGlowPulse 2.5s ease-in-out infinite',
                            borderColor: cfg.glow,
                          } : {}}>
                          <AvatarView profile={profile} size="w-full h-full" className="w-full h-full" showInitials={true} />
                        </div>
                      </div>
                      <div className="pb-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h1 className={`text-2xl md:text-3xl font-black uppercase tracking-tight ${hasEffect ? `name-gradient-${effectKey}` : ''}`}>
                            {displayName}
                          </h1>
                          <div className="bg-zinc-800/80 border border-white/[0.04] rounded-xl px-3 py-1.5 flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">Lv.{level}</span>
                            <div className="w-12 progress-bar-track">
                              <div className="progress-bar-fill bg-gradient-to-r from-purple-500 to-blue-500" style={{ width: `${xpProgress}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {profile?.username && <span className="text-purple-400 text-[10px] font-black uppercase tracking-widest">@{profile.username}</span>}
                          {profile?.status_emoji && profile?.status_text && (
                            <span className="status-badge"><span>{profile.status_emoji}</span><span className="text-gray-300">{profile.status_text}</span></span>
                          )}
                          <span className="text-gray-600 text-[9px] hidden md:inline">|</span>
                          <span className="text-gray-500 text-[9px] truncate max-w-[200px]">{user?.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile && user && profile.id !== user.id ? (
                        <FriendActionButton profileId={profile.id} playSound={playSound} />
                      ) : (
                        <button onClick={() => navigate('/profile/settings')} onMouseEnter={playSound}
                          className="bg-zinc-800/80 border border-white/[0.04] hover:bg-zinc-700/80 transition-all p-2.5 rounded-xl">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
            return hasEffect ? (
              <div className={`rounded-[32px] overflow-hidden p-[3px] border-effect-${effectKey}`}>
                {card}
              </div>
            ) : card
          })()}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Orders', value: countedOrders, color: 'from-purple-600 to-purple-500', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { label: 'Spending', value: countedSpending, color: 'from-blue-600 to-blue-500', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Collection', value: countedCollection, color: 'from-green-600 to-green-500', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
          ].map((s, idx) => (
            <div key={s.label} className={`${th.stat} p-5 hover:-translate-y-0.5 transition-all group relative overflow-hidden count-animate`}
              style={{ animationDelay: `${0.1 + idx * 0.1}s` }}>
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.color} opacity-5 rounded-full blur-[30px] -mr-8 -mt-8`} />
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{s.label}</p>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center opacity-80`}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                </div>
              </div>
              <p className={`text-2xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                {s.label === 'Spending' ? formatRupiah(s.value) : s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Quick Access</span>
            <div className="h-px flex-1 bg-gradient-to-r from-white/[0.04] to-transparent" />
          </div>
          <div className="bg-zinc-800/60 border border-white/[0.04] rounded-xl px-3 py-1.5">
            <span className="text-[7px] text-gray-500 font-black uppercase tracking-widest">{memberSince.split(',')[0]}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {navCards.map(card => {
            const Comp = card.modal ? 'button' : Link
            const props = card.modal
              ? { onClick: () => setActiveModal(card.key) }
              : { to: card.to }
            return (
              <Comp key={card.key} {...props} onMouseEnter={playSound}
                className={`group relative ${th.card} p-4 hover:-translate-y-0.5 transition-all overflow-hidden text-left`}>
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.bg} opacity-[0.04] rounded-full blur-[40px] -mr-10 -mt-10 group-hover:opacity-[0.08] transition-opacity`} />
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.bg} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                    </svg>
                  </div>
                  {card.count !== null && (
                    <span className="text-[8px] font-black text-gray-500 bg-white/[0.04] px-2 py-1 rounded-lg">{card.count}</span>
                  )}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-200">{card.label}</p>
                <p className="text-[7px] text-gray-600 font-black uppercase tracking-widest mt-1">{card.desc}</p>
              </Comp>
            )
          })}
        </div>

        {activeModal && (
          <div className="fixed inset-0 z-[9998] flex items-end md:items-center justify-center"
            onClick={() => setActiveModal(null)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className={`relative ${th.card} rounded-t-3xl md:rounded-3xl w-full md:max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl`}
              onClick={e => e.stopPropagation()}
              style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div className="sticky top-0 bg-zinc-900/90 backdrop-blur-xl border-b border-white/[0.04] px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-sm font-black uppercase tracking-tight">{activeModal === 'achievements' ? '🏆 Achievements' : activeModal === 'activity' ? '📋 Activity' : activeModal === 'chart' ? '📊 Spending Chart' : '⭐ Featured Games'}</h3>
                <button onClick={() => setActiveModal(null)}
                  className="w-7 h-7 bg-white/[0.06] rounded-lg flex items-center justify-center hover:bg-white/[0.10] transition-all">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                {activeModal === 'achievements' && (
                  <div>
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {badges.map(b => <Badge key={b.label} {...b} />)}
                    </div>
                    <div className="bg-zinc-800/40 border border-white/[0.04] rounded-2xl p-4 text-center">
                      <p className="text-[20px]">🎂</p>
                      <p className="text-xs font-black uppercase tracking-tight mt-2">{memberSince}</p>
                      <p className="text-[7px] text-gray-600 font-black uppercase tracking-widest mt-1">Member Since</p>
                    </div>
                  </div>
                )}
                {activeModal === 'activity' && (
                  <div className="space-y-0">
                    {recentActivity.length > 0 ? recentActivity.map((a, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`activity-dot ${a.type === 'purchase' ? 'bg-green-500' : 'bg-blue-500'}`} />
                          {i < recentActivity.length - 1 && <div className="activity-line flex-1" />}
                        </div>
                        <div className="pb-4 flex-1 min-w-0">
                          <p className="text-xs text-gray-300 font-bold truncate">{a.text}</p>
                          <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mt-0.5">
                            {new Date(a.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <span className="text-2xl">📭</span>
                        <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-3">No activity yet</p>
                      </div>
                    )}
                  </div>
                )}
                {activeModal === 'chart' && (
                  monthlySpending.length > 0 ? (
                    <div>
                      <div className="flex items-end gap-3 h-40">
                        {monthlySpending.map((s, i) => (
                          <div key={s.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                            <span className="text-[6px] text-gray-600 font-black leading-none">{formatRupiah(s.value)}</span>
                            <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-500 chart-bar"
                              style={{ height: `${Math.max((s.value / maxChartValue) * 100, 5)}%`, transitionDelay: `${i * 0.1}s` }} />
                            <span className="text-[7px] text-gray-600 font-black uppercase mt-1">{s.month}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <span className="text-2xl">📊</span>
                      <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-3">No spending data yet</p>
                    </div>
                  )
                )}
                {activeModal === 'featured' && (
                  featuredGames.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {featuredGames.map(g => (
                        <Link key={g.id} to={`/detail/${g.id}`} onClick={() => setActiveModal(null)}
                          className="bg-zinc-800/40 border border-white/[0.04] rounded-2xl overflow-hidden hover:border-purple-500/30 group transition-all">
                          <div className="aspect-[16/9] bg-zinc-800 overflow-hidden">
                            {g.thumbnail ? <img src={g.thumbnail} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : null}
                          </div>
                          <div className="p-3">
                            <p className="text-[9px] font-black uppercase tracking-widest truncate text-gray-300">{g.title}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <span className="text-2xl">⭐</span>
                      <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-3">No featured games selected</p>
                      <Link to="/profile/settings" onClick={() => setActiveModal(null)}
                        className="inline-block mt-3 text-[8px] text-purple-400 font-black uppercase tracking-widest hover:text-purple-300 transition-all">
                        Choose in Settings →
                      </Link>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Visitor Book */}
        <div className={`${th.card} p-6 mb-8`}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="text-base font-black uppercase tracking-tight">Visitor Book</h3>
            <span className="text-[9px] text-gray-600 font-black ml-auto">{visitorCount || 0} visits</span>
          </div>

          {user && profile && user.id !== profile.id && (
            <div className="flex gap-2 mb-5">
              <input type="text" value={visitMessage} onChange={e => setVisitMessage(e.target.value)}
                placeholder="Leave a message..."
                maxLength={100}
                className="flex-1 bg-zinc-800/60 border border-white/[0.06] rounded-2xl px-4 py-3 outline-none focus:border-blue-500/40 transition-all text-sm text-white placeholder:text-gray-700" />
              <button onClick={async () => {
                if (!visitMessage.trim()) return
                setSendingVisit(true)
                const { error } = await supabase.from('profile_visits').insert({
                  visitor_id: user.id, visited_id: profile.id, message: visitMessage.trim(),
                })
                if (!error) {
                  setVisitorMessages(prev => [{
                    id: Date.now().toString(), message: visitMessage.trim(), created_at: new Date().toISOString(),
                    visitor: { id: user.id, full_name: user.user_metadata?.full_name || 'You', username: '', avatar_url: null },
                  }, ...prev])
                  setVisitMessage('')
                }
                setSendingVisit(false)
              }} disabled={sendingVisit || !visitMessage.trim()}
                className="px-5 py-3 bg-blue-500/20 border border-blue-500/30 rounded-2xl text-[8px] font-black uppercase tracking-widest text-blue-300 hover:bg-blue-500/30 transition-all disabled:opacity-50">
                Send
              </button>
            </div>
          )}

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {visitorMessages.length > 0 ? visitorMessages.map(v => (
              <div key={v.id} className="flex items-start gap-3 bg-zinc-800/30 border border-white/[0.03] rounded-2xl p-3">
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0 mt-0.5">
                  {v.visitor?.avatar_url ? <img src={v.visitor.avatar_url} className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-white">
                      {(v.visitor?.full_name || 'G').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-300 truncate">{v.visitor?.full_name || 'Guest'}</span>
                    <span className="text-[7px] text-gray-600">{new Date(v.created_at).toLocaleDateString()}</span>
                  </div>
                  {v.message && <p className="text-xs text-gray-400 mt-0.5">{v.message}</p>}
                </div>
              </div>
            )) : (
              <p className="text-[9px] text-gray-700 text-center py-6">No messages yet</p>
            )}
          </div>
        </div>

        <div className="text-center">
          <button onClick={signOut}
            className="inline-flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all duration-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </main>
    </div>
  )
}

function FriendActionButton({ profileId, playSound }) {
  const { getFriendshipStatus, sendRequest, respondToRequest, removeFriend } = useFriends()
  const status = getFriendshipStatus(profileId)
  const { showToast } = useToast()

  if (status === 'self') return null

  if (status === 'friends') {
    return (
      <span className="px-3 py-2.5 bg-green-500/15 border border-green-500/25 rounded-xl text-[8px] font-black uppercase tracking-widest text-green-400 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
        Friends
      </span>
    )
  }

  if (status === 'pending') {
    return (
      <div className="flex gap-1.5">
        <button onClick={async () => { await respondToRequest(profileId, true); showToast('Accepted!', 'success') }}
          className="px-3 py-2.5 bg-green-500/20 border border-green-500/30 rounded-xl text-[8px] font-black uppercase tracking-widest text-green-300 hover:bg-green-500/30 transition-all">
          Accept
        </button>
        <button onClick={async () => { await respondToRequest(profileId, false) }}
          className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[8px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all">
          Reject
        </button>
      </div>
    )
  }

  if (status === 'sent') {
    return (
      <span className="px-3 py-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-[8px] font-black uppercase tracking-widest text-yellow-400 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Requested
      </span>
    )
  }

  return (
    <button onClick={async () => { const { error } = await sendRequest(profileId); if (!error) showToast('Friend request sent!', 'success') }} onMouseEnter={playSound}
      className="bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 transition-all px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
      Add Friend
    </button>
  )
}