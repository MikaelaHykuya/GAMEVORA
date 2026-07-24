import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useFriends } from '../contexts/FriendsContext'

export default function RealtimeNotifications() {
  const { profile, user } = useAuth()
  const { showToast } = useToast()
  const { fetchFriends } = useFriends()
  const toastTimer = useRef(null)

  const notified = useRef(new Set())

  const push = (title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon.png' })
    }
  }

  const notify = (title, message, type = 'info') => {
    const key = title + message
    if (notified.current.has(key)) return
    notified.current.add(key)
    showToast(message, type, 5000)
    push(title, message)
  }

  useEffect(() => {
    if (!user) return

    const channels = []

    channels.push(
      supabase.channel('realtime_notifications_' + user.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vault_notifications' }, (payload) => {
          const n = payload.new
          if (n.user_id !== user.id) return
          notify(n.title, n.message)
        })
        .subscribe()
    )

    channels.push(
      supabase.channel('realtime_library_status_' + user.id)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'library', filter: 'user_id=eq.' + user.id }, (payload) => {
          const { old: oldRow, new: newRow } = payload
          if (oldRow.status !== 'pending' || (newRow.status !== 'approved' && newRow.status !== 'rejected')) return
          const title = newRow.status === 'approved' ? 'Pembelian Disetujui' : 'Pembelian Ditolak'
          const msg = newRow.status === 'approved'
            ? 'Game kamu sudah aktif! Cek koleksi kamu sekarang.'
            : 'Pembelian kamu ditolak. Cek alasan di halaman pesanan.'
          notify(title, msg, newRow.status === 'approved' ? 'success' : 'error')
        })
        .subscribe()
    )

    // Friend request notifications
    channels.push(
      supabase.channel('realtime_friend_req_' + user.id)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
          filter: 'receiver_id=eq.' + user.id,
        }, async (payload) => {
          const { data } = await supabase.from('profiles').select('full_name').eq('id', payload.new.sender_id).single()
          if (data) {
            notify('Friend Request', `${data.full_name || 'Seseorang'} mengirim permintaan teman!`)
            fetchFriends()
          }
        })
        .subscribe()
    )

    channels.push(
      supabase.channel('realtime_friend_acc_' + user.id)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'friendships',
          filter: 'sender_id=eq.' + user.id,
        }, (payload) => {
          if (payload.new.status === 'accepted') {
            notify('Friend Request', 'Permintaan teman diterima! 🎉', 'success')
            fetchFriends()
          }
        })
        .subscribe()
    )

    if (profile?.role === 'admin') {
      channels.push(
        supabase.channel('realtime_library_new_admin_' + user.id)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'library' }, (payload) => {
            const row = payload.new
            if (row.status !== 'pending') return
            notify('Pembelian Baru!', 'Ada pembelian game baru menunggu verifikasi.')
          })
          .subscribe()
      )
    }

    channels.push(
      supabase.channel('realtime_games')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'games' }, (payload) => {
          const g = payload.new
          notify('Game Baru!', g.title + ' sudah tersedia!')
        })
        .subscribe()
    )

    channels.push(
      supabase.channel('announcements', { config: { broadcast: { self: true } } })
        .on('broadcast', { event: 'announcement' }, (payload) => {
          const p = payload.payload
          notify(p.title, p.message)
        })
        .subscribe()
    )

    return () => {
      channels.forEach(c => supabase.removeChannel(c))
    }
  }, [user, profile?.role])

  return null
}
