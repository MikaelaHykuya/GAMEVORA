import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { parseMusicUrl } from '../lib/utils'
import AvatarView, { FRAMES, ACCESSORIES } from '../components/AvatarView'
import { THEMES } from '../config/themes'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import { Helmet } from 'react-helmet-async'

export default function ProfileSettings() {
  const { showToast } = useToast()
  const { user, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [coverVideoUrl, setCoverVideoUrl] = useState('')
  const [borderEffect, setBorderEffect] = useState('none')
  const [accentColor, setAccentColor] = useState('#a855f7')
  const [bgEffect, setBgEffect] = useState('none')
  const [bgmUrl, setBgmUrl] = useState('')
  const [statusEmoji, setStatusEmoji] = useState('')
  const [statusText, setStatusText] = useState('')
  const [avatarFrame, setAvatarFrame] = useState('')
  const [avatarAccessory, setAvatarAccessory] = useState('')
  const [profileTheme, setProfileTheme] = useState('default')
  const [featuredGames, setFeaturedGames] = useState([])
  const [allGames, setAllGames] = useState([])
  const [gameSearch, setGameSearch] = useState('')
  const [loadingGames, setLoadingGames] = useState(false)
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('games').select('id, title, thumbnail').order('title', { ascending: true }),
    ]).then(([profileRes, gamesRes]) => {
      const data = profileRes.data
      if (data) {
        setFullName(data.full_name || '')
        setUsername(data.username || '')
        setAvatarUrl(data.avatar_url || '')
        setCoverUrl(data.cover_url || '')
        setCoverVideoUrl(data.cover_video_url || '')
        setBorderEffect(data.border_effect || 'none')
        setAccentColor(data.accent_color || '#a855f7')
        setBgEffect(data.bg_effect || 'none')
        setBgmUrl(data.bgm_url || '')
        setStatusEmoji(data.status_emoji || '')
        setStatusText(data.status_text || '')
        setAvatarFrame(data.avatar_frame || '')
        setAvatarAccessory(data.avatar_accessory || '')
        setProfileTheme(data.profile_theme || 'default')
        setFeaturedGames(data.featured_games || [])
      }
      setAllGames(gamesRes.data || [])
    })
  }, [user])

  const saveProfile = async () => {
    if (!fullName.trim()) return showToast('Full Name cannot be empty!', 'warning')
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, full_name: fullName, username, avatar_url: avatarUrl, cover_url: coverUrl, cover_video_url: coverVideoUrl, border_effect: borderEffect, accent_color: accentColor, bg_effect: bgEffect, bgm_url: bgmUrl, status_emoji: statusEmoji, status_text: statusText, avatar_frame: avatarFrame, avatar_accessory: avatarAccessory, profile_theme: profileTheme, featured_games: featuredGames, updated_at: new Date().toISOString(),
    })
    if (error) {
      showToast('Sync Error: ' + error.message, 'error')
    } else {
      refreshProfile()
      showToast('Vault Identity Synchronized!', 'success')
    }
    setSaving(false)
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return showToast('Maksimal ukuran foto adalah 2MB!', 'warning')

    setUploadingAvatar(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('payments').upload(fileName, file)

    if (uploadError) {
      showToast('Gagal mengupload foto: ' + uploadError.message, 'error')
      setUploadingAvatar(false)
      return
    }

    const { data } = supabase.storage.from('payments').getPublicUrl(fileName)
    setAvatarUrl(data.publicUrl)
    setUploadingAvatar(false)
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return showToast('Maksimal ukuran cover adalah 5MB!', 'warning')

    setUploadingCover(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `covers/${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('payments').upload(fileName, file)

    if (uploadError) {
      showToast('Gagal mengupload cover: ' + uploadError.message, 'error')
      setUploadingCover(false)
      return
    }

    const { data } = supabase.storage.from('payments').getPublicUrl(fileName)
    setCoverUrl(data.publicUrl)
    setUploadingCover(false)
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) return showToast('Maksimal ukuran video adalah 20MB!', 'warning')

    setUploadingVideo(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `covers/${user.id}-video-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('payments').upload(fileName, file)

    if (uploadError) {
      showToast('Gagal mengupload video: ' + uploadError.message, 'error')
      setUploadingVideo(false)
      return
    }

    const { data } = supabase.storage.from('payments').getPublicUrl(fileName)
    setCoverVideoUrl(data.publicUrl)
    setUploadingVideo(false)
  }

  const updatePassword = async () => {
    if (!newPass || newPass !== confirmPass) return showToast('Passwords do not match!', 'warning')
    if (newPass.length < 6) return showToast('Password too weak!', 'warning')
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) showToast('Error: ' + error.message, 'error')
    else {
      showToast('Password updated successfully!', 'success')
      setNewPass('')
      setConfirmPass('')
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return showToast('Fitur Notifikasi Terkunci oleh Sistem!\n\nJika kamu menggunakan iPhone/iOS, Apple MENGHARUSKAN kamu menekan tombol "Share" (Bagikan) di Safari lalu memilih "Add to Home Screen".\n\nSilakan lakukan itu, lalu buka kembali GAMEVORA dari Layar Utama HP kamu untuk menyalakan notifikasi.', 'info')
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/sw.js')
        const VAPID_PUBLIC_KEY = 'BKN9gcHtQK7rhW0Er-NzizKLXomuPfBan-uDzwT-cCVIUeSdnlCyDxDY4P4cx5gjnslkDQvh495bv9ZcuEdtKqA'

        let subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          })
        }

        const subJSON = subscription.toJSON()

        const { error } = await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          endpoint: subJSON.endpoint,
          auth_key: subJSON.keys.auth,
          p256dh_key: subJSON.keys.p256dh
        }, { onConflict: 'endpoint' })

        if (error) throw error

        showToast('Notifikasi Lockscreen berhasil diaktifkan!', 'success')
      } else {
        showToast('Izin notifikasi ditolak. Jika kamu menggunakan iOS (iPhone), pastikan kamu sudah melakukan "Add to Home Screen" melalui menu Share di Safari, lalu coba lagi dari aplikasi yang muncul di layar utamamu.', 'info')
      }
      } catch (e) {
      console.error(e)
      if (e.message && e.message.includes('auth_key')) {
        showToast('Database push_subscriptions belum memiliki kolom yang diperlukan. Jalankan SQL migration fix_notifications.sql di Supabase Dashboard.', 'error')
      } else {
        showToast('Gagal mengaktifkan notifikasi: ' + e.message, 'error')
      }
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const displayName = fullName || user?.email?.split('@')[0] || 'Vault Hunter'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>GVR - Settings</title><meta name="description" content="Your account settings" /></Helmet>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-yellow-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
      </div>

      <Navbar />
      <BottomNav />

      <main className="pt-28 px-4 md:px-6 max-w-5xl mx-auto pb-32 relative">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => navigate('/profile')} className="p-2.5 bg-white/[0.05] rounded-2xl hover:bg-white/10 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7 7l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-400 to-yellow-500 bg-clip-text text-transparent">Settings</h1>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">Manage your account</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="space-y-6">
            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-tight">Profile</h3>
              </div>
              <div className="flex flex-col items-center gap-4 py-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-600 to-blue-600">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-black">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-zinc-800 rounded-xl border-2 border-zinc-900 flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 rounded-2xl" />
                </div>
                <div className="w-full space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Upload Photo</label>
                    <span className="text-[7px] text-gray-600">Max 2MB</span>
                  </div>
                  <div className="bg-zinc-900/60 border border-white/[0.06] rounded-2xl p-3 text-center">
                    <p className="text-[9px] text-gray-500">{uploadingAvatar ? 'Uploading...' : 'Click avatar or tap to change'}</p>
                  </div>
                </div>
                <input type="url" placeholder="Or paste image URL..." value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700" />
                <div className="w-full">
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-white/[0.06] bg-transparent cursor-pointer" />
                    <input type="text" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                      className="flex-1 bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-4 py-3 outline-none focus:border-purple-500/40 transition-all text-sm text-white font-mono" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-tight">Cover Background</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Cover Image</label>
                    <span className="text-[7px] text-gray-600">Max 5MB</span>
                  </div>
                  {coverUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] mb-2">
                      <img src={coverUrl} alt="Cover" className="w-full h-32 object-cover" />
                      <button onClick={() => setCoverUrl('')}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center text-white text-xs font-black hover:bg-red-600 transition-all">
                        X
                      </button>
                    </div>
                  ) : null}
                  <div className="relative">
                    <div className="bg-zinc-900/60 border border-white/[0.06] rounded-2xl p-3 text-center cursor-pointer hover:border-green-500/30 transition-all">
                      <p className="text-[9px] text-gray-500">{uploadingCover ? 'Uploading...' : (coverUrl ? 'Tap to change cover image' : 'Tap to upload cover image')}</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploadingCover}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Cover Video (optional)</label>
                    <span className="text-[7px] text-gray-600">Max 20MB</span>
                  </div>
                  {coverVideoUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] mb-2">
                      <video src={coverVideoUrl} className="w-full h-32 object-cover" muted loop playsInline />
                      <button onClick={() => setCoverVideoUrl('')}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center text-white text-xs font-black hover:bg-red-600 transition-all">
                        X
                      </button>
                    </div>
                  ) : null}
                  <div className="relative">
                    <div className="bg-zinc-900/60 border border-white/[0.06] rounded-2xl p-3 text-center cursor-pointer hover:border-green-500/30 transition-all">
                      <p className="text-[9px] text-gray-500">{uploadingVideo ? 'Uploading...' : (coverVideoUrl ? 'Tap to change cover video' : 'Tap to upload cover video')}</p>
                    </div>
                    <input type="file" accept="video/*" onChange={handleVideoUpload} disabled={uploadingVideo}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Background Music (YouTube / SoundCloud)</label>
                  <input type="url" value={bgmUrl} onChange={e => setBgmUrl(e.target.value)} placeholder="https://youtube.com/watch?v=... or https://soundcloud.com/..."
                    className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3 outline-none focus:border-green-500/40 transition-all text-sm text-white placeholder:text-gray-700" />
                  {bgmUrl && (() => {
                    const parsed = parseMusicUrl(bgmUrl)
                    if (parsed) {
                      return (
                        <div className="mt-2 bg-zinc-800/60 border border-white/[0.06] rounded-2xl p-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center flex-shrink-0">
                            {parsed.type === 'youtube' ? (
                              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                            ) : (
                              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M11.421 0C7.613 0 4.599 3.014 4.599 6.822v6.02c0 1.623.632 3.149 1.78 4.296l-1.297 1.297a.857.857 0 0 0 0 1.213.857.857 0 0 0 1.213 0l1.488-1.488a6.046 6.046 0 0 0 3.638 1.224 6.046 6.046 0 0 0 3.638-1.224l1.488 1.488a.857.857 0 0 0 1.213 0 .857.857 0 0 0 0-1.213l-1.297-1.297a6.044 6.044 0 0 0 1.78-4.296v-2.695h.516c.89 0 1.729-.364 2.353-1.013A3.44 3.44 0 0 0 21.435 7.9a3.44 3.44 0 0 0-1.007-2.435 3.44 3.44 0 0 0-2.353-1.014h-.516V3.395C17.559 1.519 15.95 0 13.973 0h-2.552zm-.01.857h2.562c1.352 0 2.46 1.107 2.46 2.46v7.61h.516c.675 0 1.289.27 1.758.742.469.472.739 1.106.739 1.784s-.27 1.312-.739 1.784a2.47 2.47 0 0 1-1.758.742H7.837a2.47 2.47 0 0 1-1.758-.742 2.537 2.537 0 0 1-.738-1.784c0-.678.27-1.312.738-1.784a2.47 2.47 0 0 1 1.758-.742h.516v-2.66c0-2.351 1.915-4.25 4.25-4.25.262 0 .52.024.77.07h.002a4.375 4.375 0 0 0-.556-.688 4.28 4.28 0 0 0-3.016-1.242zm-1.785 5.934c.236 0 .43.194.43.43v2.66h2.23a.43.43 0 0 1 0 .859h-2.66a.43.43 0 0 1-.43-.43v-3.09c0-.235.194-.43.43-.43z"/></svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[8px] font-black uppercase tracking-widest text-green-400">{parsed.type === 'youtube' ? 'YouTube Track' : 'SoundCloud Track'}</p>
                            <p className="text-[6px] text-gray-500 font-mono truncate mt-0.5">{parsed.id}</p>
                          </div>
                          <div className="flex items-end gap-0.5 h-4">
                            {[1,2,3,4].map(i => (
                              <div key={i} className="w-1 bg-green-400 rounded-full equalizer-bar" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div className="mt-2 bg-zinc-800/60 border border-red-500/20 rounded-2xl p-3">
                        <p className="text-[8px] text-red-400 font-black uppercase tracking-widest">Invalid URL — paste a YouTube or SoundCloud link</p>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-tight">Border Effect</h3>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { key: 'none', label: 'None', colors: 'from-gray-600 to-gray-500' },
                  { key: 'fire', label: 'Fire', colors: 'from-orange-500 to-red-500' },
                  { key: 'lightning', label: 'Petir', colors: 'from-cyan-400 to-blue-500' },
                  { key: 'water', label: 'Water', colors: 'from-blue-400 to-cyan-600' },
                  { key: 'ice', label: 'Ice', colors: 'from-cyan-200 to-blue-300' },
                  { key: 'neon', label: 'Neon', colors: 'from-purple-500 to-pink-500' },
                  { key: 'rainbow', label: 'Rainbow', colors: 'from-red-500 via-yellow-500 to-blue-500' },
                  { key: 'galaxy', label: 'Galaxy', colors: 'from-indigo-700 to-pink-500' },
                  { key: 'lava', label: 'Lava', colors: 'from-red-800 to-orange-500' },
                  { key: 'ocean', label: 'Ocean', colors: 'from-blue-900 to-cyan-500' },
                ].map(e => (
                  <button key={e.key} onClick={() => setBorderEffect(e.key)}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                      borderEffect === e.key
                        ? 'border-purple-500/50 bg-purple-500/10'
                        : 'border-white/[0.04] bg-zinc-900/60 hover:border-white/[0.10]'
                    }`}>
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${e.colors} ${e.key === 'none' ? 'ring-1 ring-white/10' : ''}`} />
                    <span className="text-[7px] font-black uppercase tracking-widest text-gray-400">{e.label}</span>
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2 mt-2">Background Effect</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'none', label: 'None', icon: '◻' },
                    { key: 'matrix', label: 'Matrix', icon: '🌧' },
                    { key: 'stars', label: 'Stars', icon: '⭐' },
                    { key: 'aurora', label: 'Aurora', icon: '🌌' },
                  ].map(e => (
                    <button key={e.key} onClick={() => setBgEffect(e.key)}
                      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                        bgEffect === e.key
                          ? 'border-purple-500/50 bg-purple-500/10'
                          : 'border-white/[0.04] bg-zinc-900/60 hover:border-white/[0.10]'
                      }`}>
                      <span className="text-lg">{e.icon}</span>
                      <span className="text-[7px] font-black uppercase tracking-widest text-gray-400">{e.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-tight">Status</h3>
              </div>
              <div className="flex items-center gap-2">
                <input type="text" value={statusEmoji} onChange={e => setStatusEmoji(e.target.value)} placeholder="🎮"
                  className="w-16 bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-4 py-3.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white text-center placeholder:text-gray-700" maxLength={2} />
                <input type="text" value={statusText} onChange={e => setStatusText(e.target.value)} placeholder="Main Valorant..."
                  className="flex-1 bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700" maxLength={30} />
                {statusEmoji || statusText ? (
                  <button onClick={() => { setStatusEmoji(''); setStatusText('') }}
                    className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 hover:bg-red-500/20 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : null}
              </div>
              {statusEmoji && statusText && (
                <div className="bg-zinc-800/60 border border-white/[0.06] rounded-2xl p-3 text-center">
                  <span className="text-xs text-gray-400">{statusEmoji} {statusText}</span>
                </div>
              )}
            </div>

            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-tight">Avatar Frame</h3>
              </div>
              <div className="flex items-center gap-3">
                <AvatarView profile={{ avatar_url: avatarUrl, avatar_frame: avatarFrame, avatar_accessory: avatarAccessory, full_name: '' }} size="w-16 h-16" showInitials={false} />
                <div className="flex-1">
                  <select value={avatarFrame} onChange={e => setAvatarFrame(e.target.value)}
                    className="w-full bg-zinc-800/60 border border-white/[0.06] rounded-2xl px-4 py-3 outline-none focus:border-purple-500/40 transition-all text-sm text-white">
                    {FRAMES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-3">Accessory</p>
                <div className="flex flex-wrap gap-2">
                  {ACCESSORIES.map(a => (
                    <button key={a.id} onClick={() => setAvatarAccessory(a.id)}
                      className={`px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${
                        avatarAccessory === a.id
                          ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                          : 'bg-zinc-800/40 border-white/[0.04] text-gray-500 hover:border-white/[0.08]'
                      }`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-tight">Profile Theme</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => setProfileTheme(t.id)}
                    className={`px-4 py-3 rounded-2xl text-left border transition-all ${
                      profileTheme === t.id
                        ? 'bg-emerald-500/15 border-emerald-500/30'
                        : 'bg-zinc-800/40 border-white/[0.04] hover:border-white/[0.08]'
                    }`}>
                    <div className={`h-2 w-full rounded ${t.preview} mb-2`} />
                    <p className={`text-[9px] font-black uppercase tracking-widest ${profileTheme === t.id ? 'text-emerald-300' : 'text-gray-400'}`}>
                      {t.label}
                    </p>
                    <p className="text-[7px] text-gray-600 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-tight">Featured Games</h3>
              </div>
              <input type="text" value={gameSearch} onChange={e => setGameSearch(e.target.value)} placeholder="Search games..."
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3 outline-none focus:border-yellow-500/40 transition-all text-sm text-white placeholder:text-gray-700" />
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto no-scrollbar pr-1">
                {allGames
                  .filter(g => g.title.toLowerCase().includes(gameSearch.toLowerCase()))
                  .map(g => {
                    const selected = featuredGames.includes(g.id)
                    return (
                      <button key={g.id} onClick={() => {
                        setFeaturedGames(prev =>
                          prev.includes(g.id) ? prev.filter(id => id !== g.id) : [...prev, g.id].slice(0, 6)
                        )
                      }}
                        className={`relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all ${
                          selected
                            ? 'border-yellow-500/50 bg-yellow-500/10'
                            : 'border-white/[0.04] bg-zinc-900/60 hover:border-white/[0.10]'
                        }`}>
                        <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-zinc-800">
                          {g.thumbnail ? <img src={g.thumbnail} alt={g.title} className="w-full h-full object-cover" /> : null}
                        </div>
                        <span className="text-[6px] font-black uppercase tracking-widest text-gray-400 text-center leading-tight truncate w-full">{g.title}</span>
                        {selected && <span className="absolute top-1 right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[7px] text-black font-black">✓</span>}
                      </button>
                    )
                  })}
              </div>
              {featuredGames.length > 0 && (
                <div className="bg-zinc-800/60 border border-white/[0.06] rounded-2xl p-3 flex items-center gap-2">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">{featuredGames.length}/6 selected</span>
                  <button onClick={() => setFeaturedGames([])}
                    className="ml-auto text-[7px] text-red-400 font-black uppercase tracking-widest hover:text-red-300 transition-all">
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-tight">Notifications</h3>
              </div>
              <div className="bg-zinc-900/60 border border-blue-500/10 p-5 rounded-2xl">
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed mb-4">
                  Terima pemberitahuan real-time untuk update game baru, broadcast admin, dan persetujuan pesanan.
                  <br /><br />
                  <span className="text-blue-400">Penting untuk iOS/iPhone:</span> Kamu wajib menekan tombol <b>Share</b> di bawah layar Safari dan pilih <b>Add to Home Screen</b> terlebih dahulu.
                </p>
                <button onClick={requestNotificationPermission}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  Nyalakan Notifikasi
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-tight">Identity</h3>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Email</label>
                <div className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm text-gray-400">
                  {user?.email}
                </div>
              </div>
              <button onClick={saveProfile} disabled={saving || uploadingAvatar}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300 disabled:opacity-50">
                {saving ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    SYNCING
                  </span>
                ) : 'Save Profile'}
              </button>
            </div>

            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-tight">Security</h3>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">New Password</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Confirm Password</label>
                <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700" />
              </div>
              <button onClick={updatePassword}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300">
                Update Password
              </button>
            </div>
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
