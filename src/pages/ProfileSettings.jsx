import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
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
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || '')
        setUsername(data.username || '')
        setAvatarUrl(data.avatar_url || '')
      }
    })
  }, [user])

  const saveProfile = async () => {
    if (!fullName.trim()) return showToast('Full Name cannot be empty!', 'warning')
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, full_name: fullName, username, avatar_url: avatarUrl, updated_at: new Date().toISOString(),
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
              </div>
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
