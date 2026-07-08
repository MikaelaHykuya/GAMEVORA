import { createContext, useContext, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const notified = useRef(new Set())

  useEffect(() => {
    if (!user) return

    const friendChannel = supabase.channel('notif_friends_' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'friendships',
        filter: 'receiver_id=eq.' + user.id,
      }, async (payload) => {
        const key = 'friend_req_' + payload.new.id
        if (notified.current.has(key)) return
        notified.current.add(key)
        const { data } = await supabase.from('profiles').select('full_name').eq('id', payload.new.sender_id).single()
        if (data) showToast(`${data.full_name || 'Seseorang'} mengirim permintaan teman!`, 'info', 5000)
      })
      .subscribe()

    const acceptChannel = supabase.channel('notif_accept_' + user.id)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'friendships',
        filter: 'sender_id=eq.' + user.id,
      }, (payload) => {
        if (payload.new.status === 'accepted') {
          const key = 'friend_acc_' + payload.new.id
          if (notified.current.has(key)) return
          notified.current.add(key)
          showToast('Permintaan teman diterima! 🎉', 'success', 5000)
        }
      })
      .subscribe()

    const orderChannel = supabase.channel('notif_orders_' + user.id)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'library',
        filter: 'user_id=eq.' + user.id,
      }, (payload) => {
        const key = 'order_' + payload.new.id
        if (notified.current.has(key)) return
        notified.current.add(key)
        if (payload.new.status === 'approved') {
          showToast('Pesanan disetujui! Cek koleksi kamu 🎮', 'success', 6000)
        } else if (payload.new.status === 'rejected') {
          showToast('Pesanan ditolak', 'error', 5000)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(friendChannel)
      supabase.removeChannel(acceptChannel)
      supabase.removeChannel(orderChannel)
    }
  }, [user])

  return (
    <NotificationContext.Provider value={null}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
