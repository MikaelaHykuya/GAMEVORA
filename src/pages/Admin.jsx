import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { formatRupiah, getAvatarUrl } from '../lib/utils'
import Navbar from '../components/Navbar'
import { Helmet } from 'react-helmet-async'
import { useToast } from '../contexts/ToastContext'
import ConfirmModal from '../components/ConfirmModal'

export default function Admin() {
  const { showToast } = useToast()
  const { user, profile, isAdmin, loading, maintenance, maintenanceMessage, toggleMaintenance } = useAuth()
  const [localMaintenanceMsg, setLocalMaintenanceMsg] = useState('')

  useEffect(() => {
    setLocalMaintenanceMsg(maintenanceMessage)
  }, [maintenanceMessage])
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [games, setGames] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [users, setUsers] = useState([])
  const [proofPreview, setProofPreview] = useState(null)
  const [userOrders, setUserOrders] = useState(null)
  const [userOrdersLoading, setUserOrdersLoading] = useState(false)
  const [requests, setRequests] = useState([])
  const [pendingNewGameCount, setPendingNewGameCount] = useState(0)
  const [chatUsers, setChatUsers] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastType, setBroadcastType] = useState('info')

  const [searchGames, setSearchGames] = useState('')
  const [giveaways, setGiveaways] = useState([])
  const [giveawayTitle, setGiveawayTitle] = useState('')
  const [giveawayDesc, setGiveawayDesc] = useState('')
  const [giveawayGameId, setGiveawayGameId] = useState('')
  const [giveawayWinners, setGiveawayWinners] = useState(1)
  const [giveawayDuration, setGiveawayDuration] = useState(24)
  const [endingGiveaway, setEndingGiveaway] = useState(null)
  const [giveawayEntries, setGiveawayEntries] = useState(null)
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchUsers, setSearchUsers] = useState('')
  const [searchRequests, setSearchRequests] = useState('')
  const [refundRequests, setRefundRequests] = useState([])
  const [withdrawals, setWithdrawals] = useState([])

  const [confirm, setConfirm] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [stats, setStats] = useState({ totalGames: 0, totalUsers: 0, totalOrders: 0, approvedOrders: 0, pendingOrders: 0, totalRevenue: 0, recentOrders: [] })

  const [editId, setEditId] = useState('')
  const [uploadingZip, setUploadingZip] = useState(false)
  const [form, setForm] = useState({
    title: '', genre: 'Action', price: 0, discount_price: 0,
    thumbnail: '', description: '', manual_guide: '',
    is_trending: false, connectivity_type: 'Offline', release_type: 'instant', steam_appid: '', voratools_link: '',
    min_os: '', min_cpu: '', min_ram: '', min_gpu: '',
    rec_os: '', rec_cpu: '', rec_ram: '', rec_gpu: '',
  })
  const [downloadLinks, setDownloadLinks] = useState([])

  useEffect(() => {
    if (loading) return
    if (!isAdmin) { navigate('/'); return }
    fetchGames()
    fetchPendingOrders()
    fetchUsers()
    fetchRequests()
    fetchChats()
    fetchGiveaways()
    fetchPendingGameCount()
    fetchRefundRequests()
  }, [loading])

  useEffect(() => {
    const chatInterval = setInterval(fetchChats, 30000)
    const chatChannel = supabase.channel('admin_chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, fetchChats)
      .subscribe()
    const ordersChannel = supabase.channel('admin_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'library' }, fetchPendingOrders)
      .subscribe()
    const requestsChannel = supabase.channel('admin_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_requests' }, fetchRequests)
      .subscribe()
    const usersChannel = supabase.channel('admin_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers)
      .subscribe()
    const refundChannel = supabase.channel('admin_refunds')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'library', filter: 'status=eq.refund_requested' }, fetchRefundRequests)
      .subscribe()
      
    return () => {
      clearInterval(chatInterval)
      supabase.removeChannel(chatChannel)
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(requestsChannel)
      supabase.removeChannel(usersChannel)
      supabase.removeChannel(refundChannel)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs()
    if (activeTab === 'stats') fetchStats()
    if (activeTab === 'withdraw') fetchWithdrawals()
  }, [activeTab])

  const logAdminAction = async (action, targetType, targetId, details = {}) => {
    try {
      await supabase.from('audit_logs').insert([{
        admin_id: user?.id,
        admin_name: profile?.full_name || 'Admin',
        action,
        target_type: targetType,
        target_id: targetId,
        details,
      }])
    } catch (e) { console.error('Log error:', e) }
  }

  async function fetchStats() {
    const { count: totalGames } = await supabase.from('games').select('*', { count: 'exact', head: true })
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { data: libData } = await supabase.from('library').select('status, games(price, discount_price), created_at')
    const totalOrders = libData?.length || 0
    const approvedOrders = libData?.filter(l => l.status === 'approved').length || 0
    const pendingOrdersCount = libData?.filter(l => l.status === 'pending').length || 0
    let totalRevenue = 0
    libData?.filter(l => l.status === 'approved').forEach(l => {
      totalRevenue += Number(l.games?.discount_price || l.games?.price || 0)
    })
    const last7 = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
      const count = libData?.filter(l => {
        if (l.status !== 'approved') return false
        const ld = new Date(l.created_at)
        return ld.toDateString() === d.toDateString()
      }).length || 0
      last7.push({ dateStr, count })
    }
    setStats({ totalGames, totalUsers, totalOrders, approvedOrders, pendingOrders: pendingOrdersCount, totalRevenue, recentOrders: last7 })
  }

  async function fetchAuditLogs() {
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
    setAuditLogs(data || [])
  }

  async function fetchGames() {
    const { data } = await supabase.from('games').select('*').order('created_at', { ascending: false })
    setGames(data || [])
  }



  async function fetchPendingGameCount() {
    const { data: countSetting } = await supabase.from('settings').select('value').eq('key', 'pending_new_games_count').maybeSingle()
    setPendingNewGameCount(countSetting ? parseInt(countSetting.value) || 0 : 0)
  }

  async function fetchPendingOrders() {
    const { data, error } = await supabase.from('library')
      .select('*, games(title, price, discount_price)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending orders:', error)
      showToast('Error fetching orders: ' + error.message, 'error')
    }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(o => o.user_id))]
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
      const profileMap = {}
      if (profiles) profiles.forEach(p => { profileMap[p.id] = p })
      setPendingOrders(data.map(o => ({ ...o, profiles: profileMap[o.user_id] || null, item_name: o.games?.title || 'Unknown' })))
    } else {
      setPendingOrders(data || [])
    }
  }

  async function fetchUsers() {
    const { data, error } = await supabase.from('profiles').select('*')
    let profileList = []
    if (error || !data) {
      const { data: fallback } = await supabase.from('profiles').select('*')
      profileList = fallback || []
    } else {
      profileList = data
    }

    const { data: libraryData } = await supabase.from('library').select('user_id, game_id, proof_url, payment_proof, games(title)').eq('status', 'approved')
    const userGames = {}
    if (libraryData) {
      libraryData.forEach(l => {
        const uid = l.user_id
        if (!userGames[uid]) userGames[uid] = { count: 0, names: [], proofs: [] }
        userGames[uid].count++
        if (l.games?.title && !userGames[uid].names.includes(l.games.title)) {
          userGames[uid].names.push(l.games.title)
        }
        const proof = l.payment_proof || l.proof_url
        if (proof && !userGames[uid].proofs.includes(proof)) {
          userGames[uid].proofs.push(proof)
        }
      })
    }

    setUsers(profileList.map(u => ({
      ...u,
      game_count: userGames[u.id]?.count || 0,
      game_names: userGames[u.id]?.names || [],
      proof_urls: userGames[u.id]?.proofs || [],
    })))
  }

  async function fetchRequests() {
    const { data } = await supabase.from('game_requests').select('*').order('created_at', { ascending: false })
    setRequests(data || [])
  }

  async function fetchChats() {
    try {
    const { data } = await supabase.from('chats').select('*').order('created_at', { ascending: false })
    const userMap = {}
    if (data) {
      data.forEach(c => {
        if (!userMap[c.user_id]) {
          const lastRead = (() => { try { return parseInt(localStorage.getItem('chat_read_' + c.user_id)) || 0 } catch { return 0 } })()
          const unread = data.filter(x => x.user_id === c.user_id && !x.is_admin_reply && new Date(x.created_at).getTime() > lastRead)
          userMap[c.user_id] = {
            user_id: c.user_id,
            name: c.sender_name,
            lastMessage: c.message,
            lastTime: c.created_at,
            unread: unread.length,
          }
        }
      })
    }
    setChatUsers(Object.values(userMap))
    } catch (e) { console.error('fetchChats error', e) }
  }

  const loadChatMessages = async (userId) => {
    setSelectedChat(userId)
    const { data } = await supabase.from('chats').select('*').eq('user_id', userId).order('created_at', { ascending: true })
    setChatMessages(data || [])
    try { localStorage.setItem('chat_read_' + userId, Date.now()) } catch {}
    setTimeout(() => {
      const el = document.getElementById('chat-messages-container')
      if (el) el.scrollTop = el.scrollHeight
    }, 50)
  }

  const sendChatReply = async () => {
    if (!chatInput.trim() || !selectedChat) return
    await supabase.from('chats').insert([{
      user_id: selectedChat,
      sender_name: 'ADMIN',
      message: chatInput.trim(),
      is_admin_reply: true,
    }])
    setChatInput('')
    await loadChatMessages(selectedChat)
    fetchChats()
  }

  const sendPendingGames = async () => {
    const { data: listSetting } = await supabase.from('settings').select('value').eq('key', 'pending_new_games_list').maybeSingle()
    const currentList = listSetting ? (() => { try { return JSON.parse(listSetting.value) } catch { return [] } })() : []
    if (currentList.length === 0) return showToast('Tidak ada game pending.', 'warning')

    const gameLines = currentList.map(g => `• ${g.title}`).join('\n')
    await supabase.functions.invoke('send-discord', {
      body: {
        title: `🎮 ${currentList.length} Game Baru!`,
        message: `**${currentList.length} game** telah ditambahkan:\n\n${gameLines}`,
        type: 'new_game'
      }
    }).catch(e => console.error('Discord send pending games failed:', e))

    await supabase.from('settings').upsert({ key: 'pending_new_games_count', value: '0' }, { onConflict: 'key' })
    await supabase.from('settings').upsert({ key: 'pending_new_games_list', value: '[]' }, { onConflict: 'key' })
    setPendingNewGameCount(0)
    showToast(`✅ ${currentList.length} game berhasil dikirim ke Discord!`, 'success')
  }

  const sendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return
    
    const payload = { title: broadcastTitle.trim(), message: broadcastMessage.trim(), type: broadcastType }
    
    // Send via WebSocket (In-App)
    const existingChannel = supabase.getChannels().find(c => c.topic === 'realtime:announcements')
    if (existingChannel) {
      existingChannel.send({ type: 'broadcast', event: 'announcement', payload })
    } else {
      const channel = supabase.channel('announcements')
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({ type: 'broadcast', event: 'announcement', payload })
          setTimeout(() => supabase.removeChannel(channel), 2000)
        }
      })
    }

    // Send via Web Push (Lockscreen)
    try {
      await supabase.functions.invoke('send-push', {
        body: { title: payload.title, message: payload.message }
      })
    } catch (e) {
      console.error('Failed to trigger background push:', e)
    }

    let discordSent = false

    if (payload.type === 'new_game') {
      // Get last new_game broadcast timestamp
      const { data: settings } = await supabase.from('settings').select('value').eq('key', 'last_new_game_broadcast').maybeSingle()
      const lastBroadcast = settings?.value || '1970-01-01T00:00:00Z'

      const { count } = await supabase.from('games').select('*', { count: 'exact', head: true }).gt('created_at', lastBroadcast)

      if (count < 10) {
        showToast(`Minimal 10 game baru untuk broadcast ke Discord. Saat ini baru ${count} game. Broadcast tetap terkirim ke In-App & Push.`, 'warning')
      } else {
        const { data: newGames } = await supabase.from('games').select('title').gt('created_at', lastBroadcast).order('created_at', { ascending: false })

        const gameList = newGames.map(g => `• ${g.title}`).join('\n')
        payload.message = `${payload.message}\n\n**Game Baru:**\n${gameList}`

        await supabase.functions.invoke('send-discord', { body: payload })
        await supabase.from('settings').upsert({ key: 'last_new_game_broadcast', value: new Date().toISOString() })
        discordSent = true
      }
    } else {
      await supabase.functions.invoke('send-discord', { body: payload })
      discordSent = true
    }

    // Save to vault_news for persistent news feed
    try {
      await supabase.from('vault_news').insert([{
        title: payload.title,
        content: payload.message,
        category: payload.type === 'new_game' ? 'New Game' : payload.type === 'maintenance' ? 'Maintenance' : 'Info',
      }])
    } catch (e) {
      console.error('Failed to save broadcast to vault_news:', e)
    }
    
    setBroadcastTitle('')
    setBroadcastMessage('')
    setBroadcastType('info')

    const channels = ['In-App', 'Lockscreen']
    if (discordSent) channels.push('Discord')
    channels.push('News Feed')
    logAdminAction('send_broadcast', 'broadcast', null, { title: broadcastTitle, type: broadcastType })
    showToast(`Broadcast terkirim ke ${channels.join(', ')}!`, 'success')
  }

  const fetchGiveaways = async () => {
    const { data, error } = await supabase.from('giveaways').select('*, games(title)').order('created_at', { ascending: false })
    if (error) console.error('fetchGiveaways error:', error)
    setGiveaways(data || [])
  }

  const createGiveaway = async () => {
    if (!giveawayTitle.trim() || !giveawayGameId) return showToast('Title and Game are required', 'warning')
    setConfirm({
      title: 'Buat Giveaway',
      message: `Yakin ingin membuat giveaway "${giveawayTitle}"?`,
      confirmLabel: 'Buat',
      variant: 'default',
      onConfirm: async () => {
        const endsAt = new Date(Date.now() + giveawayDuration * 60 * 60 * 1000).toISOString()
        const { error } = await supabase.from('giveaways').insert([{
          title: giveawayTitle.trim(),
          description: giveawayDesc.trim(),
          game_id: giveawayGameId,
          winner_count: giveawayWinners,
          ends_at: endsAt,
          status: 'active',
          created_by: user?.id,
        }])
        if (error) throw new Error(error.message)

        const gameTitle = games.find(g => g.id === giveawayGameId)?.title || 'Game'
        try {
          await supabase.functions.invoke('send-discord', {
            body: {
              title: `🎉 Giveaway: ${giveawayTitle.trim()}`,
              message: `Hadiah: **${gameTitle}**\nPemenang: ${giveawayWinners} orang\nBerakhir: ${new Date(endsAt).toLocaleDateString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}\n\nJoin sekarang di website!`,
              type: 'giveaway'
            }
          })
        } catch (e) {
          console.error('Failed to send giveaway Discord:', e)
        }

        logAdminAction('create_giveaway', 'giveaways', null, { title: giveawayTitle, game_id: giveawayGameId })
        setGiveawayTitle('')
        setGiveawayDesc('')
        setGiveawayGameId('')
        setGiveawayWinners(1)
        setGiveawayDuration(24)
        fetchGiveaways()
        showToast('Giveaway created!', 'success')
      }
    })
  }

  const endGiveaway = async (id) => {
    setConfirm({
      title: 'Akhiri Giveaway',
      message: 'Yakin ingin mengakhiri giveaway ini dan memilih pemenang?',
      confirmLabel: 'Akhiri',
      variant: 'danger',
      onConfirm: async () => {
        setEndingGiveaway(id)
        try {
          const { data, error } = await supabase.functions.invoke('end-giveaway', { body: { giveaway_id: id } })
          if (error) {
            let msg = error.message
            if (error.context?.body) {
              const text = await new Response(error.context.body).text()
              if (text) msg = text
            }
            throw new Error(msg)
          }
          if (data?.error) throw new Error(data.error)
          logAdminAction('end_giveaway', 'giveaways', id)
          showToast('Giveaway ended! Winners have been notified.', 'success')
        } catch (e) {
          showToast('Error: ' + e.message, 'error')
        }
        setEndingGiveaway(null)
        fetchGiveaways()
      }
    })
  }

  const viewGiveawayEntries = async (giveawayId) => {
    setEntriesLoading(true)
    const { data } = await supabase
      .from('giveaway_entries')
      .select('*, profiles(username, full_name, email)')
      .eq('giveaway_id', giveawayId)
      .order('created_at', { ascending: false })
    setGiveawayEntries(data || [])
    setEntriesLoading(false)
  }

  const viewUserOrders = async (userId, userName) => {
    setUserOrdersLoading(true)
    const { data } = await supabase.from('library').select('*, games(title)').eq('user_id', userId).eq('status', 'approved').order('created_at', { ascending: false })
    setUserOrders({ user: userName, orders: data || [] })
    setUserOrdersLoading(false)
  }

  async function fetchRefundRequests() {
    const { data } = await supabase.from('library')
      .select('*, games(title)')
      .eq('status', 'refund_requested')
      .order('created_at', { ascending: false })
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(o => o.user_id))]
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
      const profileMap = {}
      if (profiles) profiles.forEach(p => { profileMap[p.id] = p })
      setRefundRequests(data.map(o => ({ ...o, profiles: profileMap[o.user_id] || null })))
    } else {
      setRefundRequests(data || [])
    }
  }

  async function fetchWithdrawals() {
    const { data } = await supabase.from('affiliate_withdrawals')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
    setWithdrawals(data || [])
  }

  const approveWithdrawal = async (w) => {
    setConfirm({
      title: 'Setujui Withdraw',
      message: `Yakin menyetujui withdraw ${formatRupiah(w.amount)} dari ${w.profiles?.full_name || w.profiles?.email}?`,
      confirmLabel: 'Setujui',
      variant: 'default',
      onConfirm: async () => {
        await supabase.from('affiliate_withdrawals').update({ status: 'approved', processed_at: new Date().toISOString() }).eq('id', w.id)
        await supabase.rpc('deduct_commission_balance', { p_user_id: w.user_id, p_amount: w.amount }).catch(async () => {
          const { data: prof } = await supabase.from('profiles').select('commission_balance').eq('id', w.user_id).single()
          if (prof) {
            await supabase.from('profiles').update({ commission_balance: Math.max(0, (prof.commission_balance || 0) - w.amount) }).eq('id', w.user_id)
          }
        })
        showToast('Withdraw disetujui!', 'success')
        fetchWithdrawals()
      }
    })
  }

  const rejectWithdrawal = async (w) => {
    setConfirm({
      title: 'Tolak Withdraw',
      message: `Yakin menolak withdraw ${formatRupiah(w.amount)} dari ${w.profiles?.full_name || w.profiles?.email}?`,
      confirmLabel: 'Tolak',
      variant: 'danger',
      onConfirm: async () => {
        await supabase.from('affiliate_withdrawals').update({ status: 'rejected', processed_at: new Date().toISOString() }).eq('id', w.id)
        showToast('Withdraw ditolak.', 'info')
        fetchWithdrawals()
      }
    })
  }

  const approveRefund = async (order) => {
    setConfirm({
      title: 'Setujui Refund',
      message: `Yakin menyetujui refund untuk "${order.games?.title}"?`,
      confirmLabel: 'Setujui',
      variant: 'default',
      onConfirm: async () => {
        await supabase.from('library').update({ status: 'refunded' }).eq('id', order.id)
        logAdminAction('approve_refund', 'library', order.id, { game_id: order.game_id, user_id: order.user_id })
        const title = 'Refund Disetujui'
        const message = `Refund untuk ${order.games?.title} telah disetujui.`
        await supabase.from('vault_notifications').insert([{ user_id: order.user_id, title, message }])
        supabase.functions.invoke('send-push', { body: { title, message, target_user_id: order.user_id } }).catch(console.error)
        fetchRefundRequests()
      }
    })
  }

  const rejectRefund = async (order) => {
    setConfirm({
      title: 'Tolak Refund',
      message: `Yakin menolak refund untuk "${order.games?.title}"?`,
      confirmLabel: 'Tolak',
      variant: 'danger',
      onConfirm: async () => {
        await supabase.from('library').update({ status: 'approved', refund_reason: null }).eq('id', order.id)
        logAdminAction('reject_refund', 'library', order.id, { game_id: order.game_id, user_id: order.user_id })
        const title = 'Refund Ditolak'
        const message = `Refund untuk ${order.games?.title} ditolak. Silakan hubungi admin.`
        await supabase.from('vault_notifications').insert([{ user_id: order.user_id, title, message }])
        supabase.functions.invoke('send-push', { body: { title, message, target_user_id: order.user_id } }).catch(console.error)
        fetchRefundRequests()
      }
    })
  }

  const approveOrder = async (order) => {
    setConfirm({
      title: 'Approve Payment',
      message: `Yakin approve payment untuk "${order.item_name}"?`,
      confirmLabel: 'Approve',
      variant: 'default',
      onConfirm: async () => {
        await supabase.from('library').update({ status: 'approved' }).eq('id', order.id)
        logAdminAction('approve_order', 'library', order.id, { item_name: order.item_name, user_id: order.user_id })
        const title = 'Payment Approved'
        const message = `Pembayaran untuk ${order.item_name} telah diverifikasi. Game tersedia di vault Anda.`
        await supabase.from('vault_notifications').insert([{ user_id: order.user_id, title, message }])
        supabase.functions.invoke('send-push', { body: { title, message, target_user_id: order.user_id } }).catch(console.error)

        const { data: referral } = await supabase.from('affiliate_referrals').select('id, referrer_id').eq('referred_id', order.user_id).maybeSingle()
        if (referral) {
          const orderAmount = Number(order.games?.discount_price || order.games?.price || 0)
          const commissionAmount = Math.floor(orderAmount * 10 / 100)
          if (commissionAmount > 0) {
            await supabase.from('affiliate_commissions').insert({
              referral_id: referral.id,
              referrer_id: referral.referrer_id,
              order_id: order.id,
              game_title: order.item_name,
              order_amount: orderAmount,
              commission_amount: commissionAmount,
              status: 'pending',
            })
            const { data: referrerProfile } = await supabase.from('profiles').select('commission_balance, total_earned').eq('id', referral.referrer_id).single()
            if (referrerProfile) {
              await supabase.from('profiles').update({
                commission_balance: (referrerProfile.commission_balance || 0) + commissionAmount,
                total_earned: (referrerProfile.total_earned || 0) + commissionAmount,
              }).eq('id', referral.referrer_id)
            }
          }
        }

        fetchPendingOrders()
      }
    })
  }

  const rejectOrder = async (order) => {
    setConfirm({
      title: 'Reject Payment',
      message: `Yakin reject payment untuk "${order.item_name}"?`,
      confirmLabel: 'Tolak',
      variant: 'danger',
      onConfirm: async () => {
        await supabase.from('library').update({ status: 'rejected' }).eq('id', order.id)
        logAdminAction('reject_order', 'library', order.id, { item_name: order.item_name, user_id: order.user_id })
        const title = 'Payment Rejected'
        const message = `Pembayaran untuk ${order.item_name} ditolak. Silakan hubungi admin.`
        await supabase.from('vault_notifications').insert([{ user_id: order.user_id, title, message }])
        supabase.functions.invoke('send-push', { body: { title, message, target_user_id: order.user_id } }).catch(console.error)
        fetchPendingOrders()
      }
    })
  }

  const updateRequestStatus = async (id, status) => {
    const { error } = await supabase.from('game_requests').update({ status }).eq('id', id)
    if (error) showToast('Error: ' + error.message, 'error')
    else { logAdminAction('update_request_status', 'game_requests', id, { status }); fetchRequests() }
  }



  const prepareEdit = (g) => {
    setEditId(g.id)
    setForm({
      title: g.title || '',
      genre: g.genre || 'Action',
      price: g.price || 0,
      discount_price: g.discount_price || 0,
      thumbnail: g.thumbnail || '',
      description: g.description || '',
      manual_guide: g.manual_guide || '',
      is_trending: g.is_trending || false,
      connectivity_type: g.connectivity_type || 'Offline',
      release_type: g.release_type || 'instant',
      steam_appid: g.steam_appid || '',
      voratools_link: g.voratools_link || '',
      min_os: g.specifications?.minimum?.os || '',
      min_cpu: g.specifications?.minimum?.cpu || '',
      min_ram: g.specifications?.minimum?.ram || '',
      min_gpu: g.specifications?.minimum?.gpu || '',
      rec_os: g.specifications?.recommended?.os || '',
      rec_cpu: g.specifications?.recommended?.cpu || '',
      rec_ram: g.specifications?.recommended?.ram || '',
      rec_gpu: g.specifications?.recommended?.gpu || '',
    })
    setDownloadLinks((g.download_links || []).map((link, i) => ({
      id: i + 1, label: link.label || '', url: link.url || '', icon: link.icon || 'box'
    })))
    setActiveTab('upload')
  }

  const newGame = () => {
    setEditId('')
    setForm({
      title: '', genre: 'Action', price: 0, discount_price: 0,
      thumbnail: '', description: '', manual_guide: '',
      is_trending: false, connectivity_type: 'Offline',
      release_type: 'instant', steam_appid: '', voratools_link: '',
      min_os: '', min_cpu: '', min_ram: '', min_gpu: '',
      rec_os: '', rec_cpu: '', rec_ram: '', rec_gpu: '',
    })
    setDownloadLinks([])
    setActiveTab('upload')
  }

  const saveGame = async () => {
    if (!form.title) return showToast('Title is required', 'warning')
    const specs = {
      minimum: { os: form.min_os, cpu: form.min_cpu, ram: form.min_ram, gpu: form.min_gpu },
      recommended: { os: form.rec_os, cpu: form.rec_cpu, ram: form.rec_ram, gpu: form.rec_gpu },
    }
    const download_links = downloadLinks
      .filter(l => l.url && l.url.trim() !== '')
      .map(({ id, ...link }) => link)

    const payload = {
      ...form,
      price: Number(form.price),
      discount_price: Number(form.discount_price),
      specifications: specs,
      download_links: download_links
    }
    delete payload.min_os; delete payload.min_cpu; delete payload.min_ram; delete payload.min_gpu
    delete payload.rec_os; delete payload.rec_cpu; delete payload.rec_ram; delete payload.rec_gpu

    if (editId) {
      await supabase.from('games').update(payload).eq('id', editId)
      logAdminAction('update_game', 'games', editId, { title: payload.title })
      showToast('Game updated!', 'success')
    } else {
      const { data: newGame } = await supabase.from('games').insert([payload]).select('id, title').single()
      if (newGame) {
        logAdminAction('create_game', 'games', newGame.id, { title: payload.title })
        const { data: countSetting } = await supabase.from('settings').select('value').eq('key', 'pending_new_games_count').maybeSingle()
        const { data: listSetting } = await supabase.from('settings').select('value').eq('key', 'pending_new_games_list').maybeSingle()
        const currentCount = countSetting ? parseInt(countSetting.value) || 0 : 0
        const currentList = listSetting ? (() => { try { return JSON.parse(listSetting.value) } catch { return [] } })() : []
        const newCount = currentCount + 1
        const newList = [...currentList, { id: newGame.id, title: payload.title }]

        if (newCount >= 10) {
          const gameLines = newList.map(g => `• ${g.title}`).join('\n')
          supabase.functions.invoke('send-discord', {
            body: {
              title: '🎮 10 Game Baru!',
              message: `**${newList.length} game** telah ditambahkan:\n\n${gameLines}`,
              type: 'new_game'
            }
          }).catch(e => console.error('Discord new game failed:', e))
          await supabase.from('settings').upsert({ key: 'pending_new_games_count', value: '0' }, { onConflict: 'key' })
          await supabase.from('settings').upsert({ key: 'pending_new_games_list', value: '[]' }, { onConflict: 'key' })
          setPendingNewGameCount(0)
        } else {
          await supabase.from('settings').upsert({ key: 'pending_new_games_count', value: String(newCount) }, { onConflict: 'key' })
          await supabase.from('settings').upsert({ key: 'pending_new_games_list', value: JSON.stringify(newList) }, { onConflict: 'key' })
          setPendingNewGameCount(newCount)
        }
      }
      showToast('Game created!', 'success')
    }
    fetchGames()
    setActiveTab('dashboard')
  }

  const deleteGame = async (id) => {
    const game = games.find(g => g.id === id)
    setConfirm({
      title: 'Hapus Game',
      message: `Yakin hapus "${game?.title}"? Tindakan ini tidak bisa dibatalkan.`,
      confirmLabel: 'Hapus',
      variant: 'danger',
      onConfirm: async () => {
        logAdminAction('delete_game', 'games', id, { title: game?.title })
        await supabase.from('games').delete().eq('id', id)
        fetchGames()
      }
    })
  }

  const handleZipUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.zip')) return showToast('Hanya file .zip yang diizinkan', 'warning')
    
    setUploadingZip(true)
    const fileExt = file.name.split('.').pop()
    const gameName = form.title ? form.title.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase() : 'untitled'
    const fileName = `GV-${gameName}.${fileExt}`
    const filePath = `voratools/${fileName}`

    try {
      const { error: uploadError } = await supabase.storage.from('game-assets').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('game-assets').getPublicUrl(filePath)
      setForm({ ...form, voratools_link: data.publicUrl })
      showToast('ZIP berhasil diupload ke Supabase!', 'success')
    } catch (err) {
      showToast('Gagal upload ZIP: ' + err.message + '\n\nPastikan bucket "game-assets" sudah dibuat dan diset Public di Supabase!', 'error')
    } finally {
      setUploadingZip(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Helmet><title>GVR - Admin Panel</title><meta name="description" content="GameVora administration panel" /></Helmet>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-red-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-purple-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <Navbar />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-zinc-900/95 backdrop-blur-2xl border-r border-white/[0.04] transform transition-all duration-300 ease-out flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/[0.04]">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-xs font-black">GV</div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight">Gamevora</p>
              <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Admin Panel</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-xl transition-all md:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
          {[
            { id: 'dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', label: 'Inventory' },
            { id: 'upload', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', label: editId ? 'Edit Game' : 'Upload' },
            { id: 'orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: 'Orders', count: pendingOrders.length },
            { id: 'users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'Users' },
            { id: 'requests', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', label: 'Requests', count: requests.length },
            { id: 'chat', icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z', label: 'Support Chat' },
            { id: 'broadcast', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', label: 'Broadcast' },
            { id: 'giveaway', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7', label: 'Giveaway' },
            { id: 'refund', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', label: 'Refund', count: refundRequests.length },
            { id: 'maintenance', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', label: 'Maintenance' },
            { id: 'withdraw', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Withdraw' },
            { id: 'audit', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Audit Log' },
            { id: 'stats', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Stats' }
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600/30 to-purple-500/20 text-white border border-purple-500/20 shadow-lg shadow-purple-600/10'
                  : 'text-gray-500 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}>
              <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              <span className="flex-1 text-left">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[9px] font-black min-w-[22px] h-[22px] flex items-center justify-center rounded-full ${
                  tab.id === 'orders' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/[0.04]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/[0.02]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600/40 to-purple-500/40 flex items-center justify-center text-[10px] font-black uppercase border border-purple-400/20">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold truncate">{profile?.full_name || 'Admin'}</p>
              <p className="text-[7px] text-gray-600 truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`min-h-screen transition-all duration-300 ${'md:ml-64'} pt-0 pb-36 md:pb-8 relative`}>
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-2xl border-b border-white/[0.04] px-4 md:px-8">
          <div className="flex items-center justify-between h-16 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 hover:bg-white/5 rounded-xl transition-all md:hidden">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <p className="text-[9px] text-purple-400 font-black uppercase tracking-[0.3em]">Admin Terminal</p>
                <h1 className="text-xl md:text-2xl font-black italic uppercase tracking-tight">Master Control</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden md:block text-[8px] text-gray-600 font-bold uppercase tracking-widest">
                {activeTab === 'dashboard' && `${games.length} Games`}
                {activeTab === 'orders' && `${pendingOrders.length} Pending`}
                {activeTab === 'refund' && `${refundRequests.length} Refund`}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile tab strip */}
        <div className="md:hidden overflow-x-auto no-scrollbar -mx-4 px-4 mb-2 mt-4">
          <div className="flex gap-1.5 pb-0.5">
            {[
              { id: 'dashboard', label: 'Inventory' },
              { id: 'upload', label: 'Upload' },
              { id: 'orders', label: 'Orders', count: pendingOrders.length },
              { id: 'users', label: 'Users' },
              { id: 'requests', label: 'Requests', count: requests.length },
              { id: 'chat', label: 'Chat' },
              { id: 'broadcast', label: 'Broadcast' },
              { id: 'giveaway', label: 'Giveaway' },
              { id: 'refund', label: 'Refund', count: refundRequests.length },
              { id: 'maintenance', label: 'Maint' },
              { id: 'withdraw', label: 'Withdraw' },
              { id: 'audit', label: 'Audit' },
              { id: 'stats', label: 'Stats' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative whitespace-nowrap px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-purple-500/30 shadow-lg shadow-purple-600/20'
                    : 'bg-zinc-900/60 border-white/[0.06] text-gray-400 hover:text-white hover:border-white/[0.12]'
                }`}>
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1.5 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 align-middle">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 md:px-8 max-w-7xl mx-auto pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
            {activeTab === 'dashboard' && (
              <div>
                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                  {[
                    { label: 'Total Games', value: games.length, color: 'from-purple-600 to-purple-500', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
                    { label: 'Total Users', value: users.length, color: 'from-blue-600 to-blue-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                    { label: 'Orders', value: pendingOrders.length, color: 'from-emerald-600 to-emerald-500', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                    { label: 'Refund', value: refundRequests.length, color: 'from-amber-600 to-amber-500', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
                    { label: 'Requests', value: requests.length, color: 'from-rose-600 to-rose-500', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-zinc-900/60 border border-white/[0.04] rounded-2xl p-4 hover:border-white/[0.08] transition-all group">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20 flex items-center justify-center`}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                          </svg>
                        </div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</p>
                      </div>
                      <p className={`text-2xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Action bar */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
                    <div className="relative flex-1">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input type="text" placeholder="Cari game..." value={searchGames} onChange={e => setSearchGames(e.target.value)}
                        className="w-full md:w-80 bg-zinc-900/60 border border-white/[0.06] rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-purple-500/40 focus:bg-zinc-900/80 transition-all text-sm text-white placeholder:text-gray-700" />
                    </div>
                    {pendingNewGameCount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 rounded-xl whitespace-nowrap">
                          Discord {pendingNewGameCount}/10
                        </span>
                        <button onClick={sendPendingGames} className="text-[9px] font-black text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-2 rounded-xl hover:bg-green-400/20 transition-all active-scale whitespace-nowrap">
                          Kirim →
                        </button>
                      </div>
                    )}
                  </div>
                  <button onClick={newGame} className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase active-scale hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300 flex items-center gap-2 whitespace-nowrap">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    New Game
                  </button>
                </div>

                {/* Game Table */}
                <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/[0.04]">
                          <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Game</th>
                          <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden md:table-cell">Genre</th>
                          <th className="text-right py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Price</th>
                          <th className="text-center py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden md:table-cell">Status</th>
                          <th className="text-right py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {games.filter(g => g.title.toLowerCase().includes(searchGames.toLowerCase())).map(g => (
                          <tr key={g.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all group">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <img src={g.thumbnail} className="w-10 h-10 rounded-xl object-cover border border-white/5 flex-shrink-0" alt="" />
                                <div>
                                  <p className="text-[12px] font-bold leading-tight">{g.title}</p>
                                  <p className="text-[8px] text-gray-600 mt-0.5">#{g.id?.slice(0, 6)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-5 hidden md:table-cell">
                              <span className="text-[9px] text-gray-500 font-bold">{g.genre}</span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <span className="text-[11px] font-black text-purple-400">{formatRupiah(g.discount_price || g.price)}</span>
                              {g.discount_price > 0 && g.price > g.discount_price && (
                                <span className="text-[8px] text-gray-600 line-through ml-2">{formatRupiah(g.price)}</span>
                              )}
                            </td>
                            <td className="py-4 px-5 text-center hidden md:table-cell">
                              {g.is_trending ? (
                                <span className="text-[8px] font-black text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg uppercase tracking-wider">Trending</span>
                              ) : (
                                <span className="text-[8px] text-gray-700 font-bold">—</span>
                              )}
                            </td>
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-all">
                                <button onClick={() => prepareEdit(g)} className="px-3.5 py-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl text-[8px] font-bold uppercase tracking-wider transition-all">
                                  Edit
                                </button>
                                <button onClick={() => deleteGame(g.id)} className="px-3.5 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-[8px] font-bold uppercase tracking-wider transition-all">
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {games.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      </div>
                      <p className="text-[11px] text-gray-600 font-black uppercase tracking-wider">Belum ada game</p>
                    </div>
                  )}
                </div>
              </div>
            )}

        {activeTab === 'upload' && (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 md:p-10 max-w-3xl mx-auto">
            <h2 className="text-xl font-black uppercase tracking-tight mb-8">{editId ? `Update: ${form.title}` : 'Upload Game Baru'}</h2>
            <div className="space-y-10">
              {[
                { title: 'Basic Information', color: 'purple', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', fields: (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Title</label>
                      <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                        className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Steam App ID</label>
                      <input type="text" placeholder="e.g. 730" value={form.steam_appid} onChange={e => setForm({ ...form, steam_appid: e.target.value })}
                        className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Genre</label>
                      <select value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })}
                        className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white cursor-pointer focus:border-purple-500/40 transition-all">
                        {['Action', 'RPG', 'Horror', 'Adventure', 'Simulation'].map(g => <option key={g} className="bg-zinc-900">{g}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Connectivity</label>
                        <select value={form.connectivity_type} onChange={e => setForm({ ...form, connectivity_type: e.target.value })}
                          className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white cursor-pointer focus:border-purple-500/40 transition-all">
                          <option className="bg-zinc-900">Online</option>
                          <option className="bg-zinc-900">Offline</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Release</label>
                        <select value={form.release_type} onChange={e => setForm({ ...form, release_type: e.target.value })}
                          className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white cursor-pointer focus:border-purple-500/40 transition-all">
                          <option className="bg-zinc-900">instant</option>
                          <option className="bg-zinc-900">scheduled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )},
                { title: 'Pricing & Promotion', color: 'green', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', fields: (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Price (Rp)</label>
                      <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                        className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Discount Price (Rp)</label>
                      <input type="number" value={form.discount_price} onChange={e => setForm({ ...form, discount_price: e.target.value })}
                        className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all w-max">
                        <input type="checkbox" checked={form.is_trending} onChange={e => setForm({ ...form, is_trending: e.target.checked })}
                          className="accent-red-500 w-4 h-4" />
                        <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Mark as Trending</span>
                      </label>
                    </div>
                  </div>
                )},
                { title: 'Media & Content', color: 'blue', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', fields: (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Thumbnail URL</label>
                      <input type="url" value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                        className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Description</label>
                      <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="4"
                        className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white resize-none focus:border-purple-500/40 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Manual Guide</label>
                      <textarea value={form.manual_guide} onChange={e => setForm({ ...form, manual_guide: e.target.value })} rows="3"
                        className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white resize-none focus:border-purple-500/40 transition-all" />
                    </div>
                  </div>
                )},
                { title: 'Downloads & Integration', color: 'yellow', icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', fields: (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-purple-400 tracking-widest flex justify-between">
                        <span>VoraTools License File (.ZIP)</span>
                        {uploadingZip && <span className="text-yellow-400 animate-pulse">Uploading...</span>}
                      </label>
                      <div className="flex flex-col md:flex-row gap-3">
                        <input type="url" placeholder="Direct link to ZIP..." value={form.voratools_link} onChange={e => setForm({ ...form, voratools_link: e.target.value })}
                          className="flex-1 bg-zinc-900/60 border border-purple-500/30 rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500 transition-all" />
                        <label className="bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/40 text-purple-400 rounded-2xl px-6 py-3.5 cursor-pointer transition-all flex items-center justify-center shrink-0">
                          <input type="file" accept=".zip" className="hidden" onChange={handleZipUpload} disabled={uploadingZip} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Upload ZIP</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Download Links</label>
                        <button type="button" onClick={() => setDownloadLinks([...downloadLinks, { id: Date.now(), label: '', url: '', icon: 'box' }])}
                          className="text-[9px] font-black text-purple-400 hover:text-white transition tracking-widest uppercase">
                          + Tambah Link
                        </button>
                      </div>
                      <div className="space-y-3">
                        {downloadLinks.map((link, i) => (
                          <div key={link.id} className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-zinc-900/20 border border-white/[0.04] rounded-2xl p-3">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                              <input type="text" placeholder="Label (contoh: Game File, Patch)" value={link.label}
                                onChange={e => { const next = [...downloadLinks]; next[i] = { ...next[i], label: e.target.value }; setDownloadLinks(next) }}
                                className="bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                              <input type="url" placeholder="URL download..." value={link.url}
                                onChange={e => { const next = [...downloadLinks]; next[i] = { ...next[i], url: e.target.value }; setDownloadLinks(next) }}
                                className="bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                              <select value={link.icon}
                                onChange={e => { const next = [...downloadLinks]; next[i] = { ...next[i], icon: e.target.value }; setDownloadLinks(next) }}
                                className="bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all appearance-none cursor-pointer">
                                <option value="box">📦 Box</option>
                                <option value="fix">🛠️ Fix / Update</option>
                                <option value="guide">📖 Guide</option>
                                <option value="tool">🔧 Tool</option>
                              </select>
                            </div>
                            <button type="button" onClick={() => setDownloadLinks(downloadLinks.filter((_, j) => j !== i))}
                              className="text-red-400 hover:text-red-300 transition p-2 shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        {downloadLinks.length === 0 && (
                          <p className="text-[10px] text-gray-600 text-center py-4 uppercase tracking-wider">Belum ada link download. Klik "+ Tambah Link" untuk menambahkan.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )},
              ].map((section, i) => (
                <div key={i} className="border-t border-white/[0.05] pt-8 first:border-0 first:pt-0">
                  <p className={`text-[10px] font-black text-${section.color}-400 uppercase tracking-[0.3em] mb-5 flex items-center gap-2`}>
                    <span className={`w-2 h-2 rounded-full bg-${section.color}-500 animate-pulse`}></span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                    </svg>
                    {section.title}
                  </p>
                  {section.fields}
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-white/[0.05]">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                System Specifications
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Minimum', key: 'min' },
                  { label: 'Recommended', key: 'rec' },
                ].map(spec => (
                  <div key={spec.key} className="space-y-3">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{spec.label}</p>
                    {['os', 'cpu', 'ram', 'gpu'].map(s => (
                      <input key={s} type="text" placeholder={s.toUpperCase()} value={form[`${spec.key}_${s}`]} onChange={e => setForm({ ...form, [`${spec.key}_${s}`]: e.target.value })}
                        className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={saveGame} className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest mt-8 active-scale hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300">
              {editId ? 'Apply Updates' : 'Upload Game'}
            </button>
          </div>
        )}



        {activeTab === 'requests' && (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight">Game Requests</h2>
              <span className="text-[10px] text-yellow-500 font-black bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20">
                {requests.length} requests
              </span>
            </div>
            <div className="mb-5 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Cari Request..." value={searchRequests} onChange={e => setSearchRequests(e.target.value)}
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl pl-11 pr-5 py-3.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700" />
            </div>
            {requests.length === 0 ? (
              <p className="text-center py-10 opacity-30 text-[10px] font-black uppercase italic">No game requests yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-[8px] text-gray-600 font-black uppercase tracking-widest">
                      <th className="pb-4 px-3 text-left hidden md:table-cell">User Email</th>
                      <th className="pb-4 px-3 text-left">Game Title</th>
                      <th className="pb-4 px-3 text-left hidden sm:table-cell">Notes</th>
                      <th className="pb-4 px-3 text-left hidden md:table-cell">Date</th>
                      <th className="pb-4 px-3 text-center">Status</th>
                      <th className="pb-4 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.filter(r => (r.game_title||'').toLowerCase().includes(searchRequests.toLowerCase()) || (r.user_email||'').toLowerCase().includes(searchRequests.toLowerCase())).map(r => (
                      <tr key={r.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all">
                        <td className="py-4 px-3 font-mono text-[9px] text-gray-500 uppercase tracking-tighter max-w-[120px] truncate hidden md:table-cell">{r.user_email || '-'}</td>
                        <td className="py-4 px-3 text-[10px] font-black uppercase truncate max-w-[120px] sm:max-w-none">{r.game_title || '-'}</td>
                        <td className="py-4 px-3 text-[9px] text-gray-400 max-w-[120px] sm:max-w-[300px] truncate hidden sm:table-cell">
                          <span className="text-purple-400 font-bold mr-2">[{r.platform}]</span>
                          {r.notes || '-'}
                        </td>
                        <td className="py-4 px-3 text-[9px] text-gray-500 hidden md:table-cell">{r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-'}</td>
                        <td className="py-4 px-3 text-center">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                            r.status === 'fullverified' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                            r.status === 'proses' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
                            r.status === 'rejected' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                            'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                          }`}>
                            {r.status || 'pending'}
                          </span>
                        </td>
                        <td className="py-4 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => updateRequestStatus(r.id, 'proses')} className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            <button onClick={() => updateRequestStatus(r.id, 'fullverified')} className="p-1.5 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white rounded-lg transition-all">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            <button onClick={() => updateRequestStatus(r.id, 'rejected')} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight">Support Chat</h2>
              <span className="text-[10px] text-purple-400 font-black bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20">
                {chatUsers.length} conversations
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1 bg-zinc-900/60 border border-white/[0.04] rounded-2xl p-4 max-h-[550px] overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Inbox</h3>
                  {chatUsers.filter(u => u.unread > 0).length > 0 && (
                    <span className="text-[8px] text-purple-400 font-black">{chatUsers.filter(u => u.unread > 0).length} new</span>
                  )}
                </div>
                {chatUsers.length === 0 ? (
                  <p className="text-gray-600 text-[10px] font-black uppercase italic text-center py-10">No conversations</p>
                ) : (
                  <div className="space-y-1">
                    {chatUsers.map(u => (
                      <button key={u.user_id} onClick={() => loadChatMessages(u.user_id)}
                        className={`w-full text-left p-3 rounded-2xl transition-all duration-300 ${
                          selectedChat === u.user_id
                            ? 'bg-gradient-to-r from-purple-600/20 to-purple-500/20 border border-purple-500/25'
                            : 'hover:bg-zinc-800/60 border border-transparent'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600/40 to-purple-500/40 flex items-center justify-center text-[11px] font-black uppercase shrink-0 border border-purple-400/20">
                            {u.name?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-black uppercase truncate">{u.name || u.user_id.slice(0, 8)}</span>
                              <span className="text-[7px] text-gray-600 shrink-0">{u.lastTime ? new Date(u.lastTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <span className="text-[8px] text-gray-600 truncate">{u.lastMessage}</span>
                              {u.unread > 0 && (
                                <span className="shrink-0 bg-purple-600 text-white text-[7px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full">{u.unread}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="md:col-span-2 bg-zinc-900/60 border border-white/[0.04] rounded-2xl flex flex-col h-[550px]">
                {!selectedChat ? (
                  <div className="flex-1 flex items-center justify-center text-gray-600 text-[10px] font-black uppercase italic">
                    <div className="text-center">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-800/60 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      Pilih user untuk memulai chat
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-white/[0.04] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600/40 to-purple-500/40 flex items-center justify-center text-[11px] font-black uppercase border border-purple-400/20">
                        {chatUsers.find(u => u.user_id === selectedChat)?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase">{chatUsers.find(u => u.user_id === selectedChat)?.name || selectedChat.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div id="chat-messages-container" className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                      {chatMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] p-3 text-[10px] font-bold leading-relaxed ${
                            msg.is_admin_reply
                              ? 'bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl rounded-bl-[4px]'
                              : 'bg-zinc-800/80 rounded-2xl rounded-br-[4px]'
                          }`}>
                            <div className="text-[7px] opacity-50 uppercase tracking-widest mb-1">
                              {msg.is_admin_reply ? 'Admin' : msg.sender_name}
                            </div>
                            {msg.message}
                            <div className="text-[7px] mt-1.5 opacity-40">
                              {new Date(msg.created_at).toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-white/[0.04] flex gap-3">
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendChatReply()}
                        placeholder="Ketik balasan..."
                        className="flex-1 bg-zinc-800/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-[11px] outline-none text-white font-bold placeholder:text-gray-700 focus:border-purple-500/30 transition-all" />
                      <button onClick={sendChatReply}
                        className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest active-scale hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300">
                        Kirim
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'giveaway' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-6">Buat Giveaway</p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Judul</label>
                  <input type="text" value={giveawayTitle} onChange={e => setGiveawayTitle(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all"
                    placeholder="e.g. Summer Giveaway" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Deskripsi</label>
                  <textarea value={giveawayDesc} onChange={e => setGiveawayDesc(e.target.value)} rows={3}
                    className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white resize-none focus:border-purple-500/40 transition-all"
                    placeholder="Deskripsi giveaway..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Game Hadiah</label>
                  <div className="relative">
                    <select value={giveawayGameId} onChange={e => setGiveawayGameId(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white appearance-none cursor-pointer focus:border-purple-500/40 transition-all">
                      <option value="" className="bg-zinc-900 text-gray-400">Pilih game...</option>
                      {games.map(g => <option key={g.id} value={g.id} className="bg-zinc-900 text-white">{g.title}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-5">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Jumlah Pemenang</label>
                    <input type="number" min="1" max="10" value={giveawayWinners} onChange={e => setGiveawayWinners(Number(e.target.value))}
                      className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Durasi (jam)</label>
                    <input type="number" min="1" max="720" value={giveawayDuration} onChange={e => setGiveawayDuration(Number(e.target.value))}
                      className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                  </div>
                </div>
                <button onClick={createGiveaway} disabled={!giveawayTitle.trim() || !giveawayGameId}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-3.5 rounded-2xl hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300 active:scale-[0.98] text-[11px] tracking-[0.2em] uppercase disabled:opacity-50">
                  Buat Giveaway
                </button>
              </div>
            </div>
            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-6">Daftar Giveaway</p>
              <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
                {giveaways.length === 0 ? (
                  <p className="text-[9px] text-gray-600 text-center py-10 font-black uppercase tracking-widest">Belum ada giveaway</p>
                ) : giveaways.map(g => (
                  <div key={g.id} className="bg-zinc-900/60 border border-white/[0.04] rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-black uppercase">{g.title}</p>
                        <p className="text-[9px] text-gray-500 mt-1">{g.games?.title || 'Unknown'}</p>
                      </div>
                      <span className={`px-3 py-1.5 rounded text-[8px] font-black uppercase border ${
                        g.status === 'active' ? 'text-green-500 border-green-500/30 bg-green-500/10' :
                        g.status === 'ended' ? 'text-gray-500 border-gray-500/30 bg-gray-500/10' :
                        'text-red-500 border-red-500/30 bg-red-500/10'
                      }`}>{g.status}</span>
                    </div>
                    {g.status === 'active' && (
                      <button onClick={() => endGiveaway(g.id)} disabled={endingGiveaway === g.id}
                        className="w-full mt-3 bg-red-500/10 border border-red-500/20 text-red-400 font-black py-3 rounded-2xl text-[8px] tracking-wider uppercase hover:bg-red-500/20 transition-all active-scale disabled:opacity-50">
                        {endingGiveaway === g.id ? 'Memilih winner...' : 'Akhiri & Pilih Winner'}
                      </button>
                    )}
                    <button onClick={() => viewGiveawayEntries(g.id)}
                      className="w-full mt-2 bg-zinc-800/60 border border-white/[0.04] text-gray-400 font-black py-3 rounded-2xl text-[8px] tracking-wider uppercase hover:bg-zinc-800 hover:text-white transition-all active-scale">
                      Lihat Peserta
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'refund' && (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight">Refund Requests</h2>
              <span className="text-[10px] text-blue-400 font-black bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
                {refundRequests.length} menunggu
              </span>
            </div>
            {refundRequests.length === 0 ? (
              <p className="text-center py-10 opacity-30 text-[10px] font-black uppercase italic">No refund requests</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[8px] text-gray-600 font-black uppercase tracking-widest">
                      <th className="pb-4 px-2 hidden sm:table-cell">ID</th>
                      <th className="pb-4 px-2">Game</th>
                      <th className="pb-4 px-2 hidden md:table-cell">User</th>
                      <th className="pb-4 px-2">Alasan</th>
                      <th className="pb-4 px-2 hidden sm:table-cell">Tanggal</th>
                      <th className="pb-4 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refundRequests.map(order => (
                      <tr key={order.id} className="hover:bg-white/[0.01] transition-all border-b border-white/[0.02]">
                        <td className="py-5 px-2 font-mono text-[9px] text-gray-500 uppercase tracking-tighter whitespace-nowrap hidden sm:table-cell">
                          #GV-{order.id?.split('-')?.[0]?.toUpperCase()}
                        </td>
                        <td className="py-5 px-2">
                          <p className="text-[10px] font-black uppercase truncate max-w-[100px] sm:max-w-[120px]">{order.games?.title || 'Unknown'}</p>
                        </td>
                        <td className="py-5 px-2 hidden md:table-cell">
                          <p className="text-[9px] font-bold truncate max-w-[80px]">{order.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-[7px] text-gray-500 truncate max-w-[80px]">{order.profiles?.email}</p>
                        </td>
                        <td className="py-5 px-2 max-w-[120px] sm:max-w-[200px]">
                          <p className="text-[8px] text-gray-400 leading-relaxed line-clamp-2">{order.refund_reason || '-'}</p>
                        </td>
                        <td className="py-5 px-2 text-[8px] font-bold text-gray-600 uppercase whitespace-nowrap hidden sm:table-cell">
                          {new Date(order.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-5 px-2">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => approveRefund(order)}
                              className="px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-[8px] font-black uppercase tracking-wider active-scale hover:bg-green-500/20 transition-all">
                              Setujui
                            </button>
                            <button onClick={() => rejectRefund(order)}
                              className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[8px] font-black uppercase tracking-wider active-scale hover:bg-red-500/20 transition-all">
                              Tolak
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 max-w-xl">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Maintenance Mode</p>
              <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider border transition-all duration-300 ${
                maintenance
                  ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                  : 'text-green-400 border-green-500/30 bg-green-500/10'
              }`}>
                {maintenance ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight">Site Status</h3>
                <p className="text-[8px] text-gray-500 mt-1 font-bold tracking-wider">
                  Saat aktif, hanya admin yang bisa mengakses website
                </p>
              </div>
              <button
                onClick={() => {
                  if (maintenance) {
                    toggleMaintenance(false, '').then(({ error }) => {
                      if (error) showToast('Gagal: ' + error.message, 'error')
                      else logAdminAction('disable_maintenance', 'settings', 'maintenance')
                    })
                    return
                  }
                  setConfirm({
                    title: 'Aktifkan Maintenance',
                    message: 'Masukkan pesan yang akan ditampilkan ke pengguna:',
                    confirmLabel: 'Aktifkan',
                    variant: 'default',
                    inputMode: true,
                    inputPlaceholder: 'Kami sedang melakukan pemeliharaan...',
                    onConfirm: async (msg) => {
                      const { error } = await toggleMaintenance(true, msg)
                      if (error) showToast('Gagal: ' + error.message, 'error')
                      else {
                        logAdminAction('enable_maintenance', 'settings', 'maintenance', { message: msg })
                        if (msg) {
                          supabase.functions.invoke('send-discord', {
                            body: { title: '🔧 Maintenance Aktif', message: msg, type: 'maintenance' }
                          }).catch(e => console.error('Discord maintenance report failed:', e))
                        }
                      }
                    }
                  })
                }}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 active-scale ${
                  maintenance
                    ? 'bg-yellow-500/30 border border-yellow-500/40'
                    : 'bg-green-500/20 border border-green-500/30'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full shadow-lg transition-all duration-300 ${
                  maintenance
                    ? 'left-[30px] bg-yellow-400'
                    : 'left-1 bg-green-400'
                }`} />
              </button>
            </div>

            {maintenance && (
              <div className="space-y-3 mb-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Pesan Maintenance</label>
                  <input type="text" value={localMaintenanceMsg} onChange={e => setLocalMaintenanceMsg(e.target.value)}
                    placeholder="Kami sedang melakukan pemeliharaan..."
                    className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                </div>
                <button onClick={async () => {
                    const { error } = await toggleMaintenance(true, localMaintenanceMsg)
                    if (error) showToast('Gagal update: ' + error.message, 'error')
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-3.5 rounded-2xl text-[11px] tracking-[0.2em] uppercase active-scale hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300">
                  Update Pesan
                </button>
              </div>
            )}

            <div className="p-4 bg-zinc-900/60 border border-yellow-500/10 rounded-2xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-yellow-400">Peringatan</p>
                  <p className="text-[8px] text-gray-500 mt-1 leading-relaxed font-bold">
                    Saat maintenance aktif, semua pengguna non-admin akan melihat halaman maintenance dan tidak bisa mengakses fitur apapun.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight">Pending Orders</h2>
              <span className="text-[10px] text-yellow-500 font-black bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20">
                {pendingOrders.length} menunggu
              </span>
            </div>
            {pendingOrders.length === 0 ? (
              <p className="text-center py-10 opacity-30 text-[10px] font-black uppercase italic">No pending orders</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-[8px] text-gray-600 font-black uppercase tracking-widest">
                      <th className="pb-4 px-3 text-left hidden sm:table-cell">ID</th>
                      <th className="pb-4 px-3 text-left">Game</th>
                      <th className="pb-4 px-3 text-left">User</th>
                      <th className="pb-4 px-3 text-right hidden sm:table-cell">Amount</th>
                      <th className="pb-4 px-3 text-center">Proof</th>
                      <th className="pb-4 px-3 text-left hidden md:table-cell">Date</th>
                      <th className="pb-4 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map(order => (
                      <tr key={order.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all group">
                        <td className="py-4 px-3 font-mono text-[9px] text-gray-500 uppercase tracking-tighter whitespace-nowrap hidden sm:table-cell">
                          #GV-{order.id?.split('-')?.[0]?.toUpperCase()}
                        </td>
                        <td className="py-4 px-3">
                          <p className="text-[10px] font-black uppercase truncate max-w-[100px] sm:max-w-[120px]">{order.item_name}</p>
                        </td>
                        <td className="py-4 px-3">
                          <p className="text-[9px] font-bold truncate max-w-[80px] sm:max-w-none">{order.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-[7px] text-gray-500 truncate max-w-[80px] sm:max-w-none">{order.profiles?.email}</p>
                        </td>
                        <td className="py-4 px-3 text-right text-[10px] font-black text-purple-400 whitespace-nowrap hidden sm:table-cell">
                          {order.games ? 'Rp ' + Number(order.games.discount_price || order.games.price || 0).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-4 px-3 text-center">
                          {order.payment_proof ? (
                            <button onClick={() => setProofPreview(order)}
                              className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[8px] font-black text-blue-400 hover:bg-blue-500/20 transition-all active-scale">
                              Lihat
                            </button>
                          ) : (
                            <span className="text-[8px] text-gray-600">-</span>
                          )}
                        </td>
                        <td className="py-4 px-3 text-[8px] font-bold text-gray-600 uppercase whitespace-nowrap hidden md:table-cell">
                          {new Date(order.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-4 px-3">
                          <div className="flex gap-1.5 justify-center md:opacity-0 md:group-hover:opacity-100 transition-all">
                            <button onClick={() => approveOrder(order)}
                              className="px-3.5 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-[8px] font-black uppercase tracking-wider active-scale hover:bg-green-500/20 transition-all">
                              Approve
                            </button>
                            <button onClick={() => rejectOrder(order)}
                              className="px-3.5 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[8px] font-black uppercase tracking-wider active-scale hover:bg-red-500/20 transition-all">
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total Users', value: users.length, color: 'from-purple-600 to-purple-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'from-rose-600 to-rose-500', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                { label: 'With Games', value: users.filter(u => u.game_count > 0).length, color: 'from-emerald-600 to-emerald-500', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
                { label: 'Bulan Ini', value: users.filter(u => { const d = new Date(u.created_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length, color: 'from-blue-600 to-blue-500', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
              ].map(card => (
                <div key={card.label} className="bg-zinc-900/60 border border-white/[0.04] rounded-2xl p-4 hover:border-white/[0.08] transition-all group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                      </svg>
                    </div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{card.label}</p>
                  </div>
                  <p className={`text-2xl font-black bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>{card.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-5 py-4 border-b border-white/[0.04]">
                <h2 className="text-xs font-black uppercase tracking-tight">All Users</h2>
                <div className="relative w-full md:w-72">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Cari User..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl pl-9 pr-4 py-2.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">User</th>
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden sm:table-cell">Email</th>
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden md:table-cell">Role</th>
                      <th className="text-center py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Games</th>
                      <th className="text-center py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Orders</th>
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden lg:table-cell">Kode Affiliate</th>
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden sm:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-16">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <p className="text-[11px] text-gray-600 font-black uppercase tracking-wider">Belum ada user</p>
                      </td></tr>
                    ) : (
                      users.filter(u => (u.full_name||'').toLowerCase().includes(searchUsers.toLowerCase()) || (u.email||'').toLowerCase().includes(searchUsers.toLowerCase())).map(u => (
                        <tr key={u.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all group">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 overflow-hidden border border-white/10 flex-shrink-0">
                                <img src={u.avatar_url || getAvatarUrl(u.full_name || u.email)} className="w-full h-full object-cover" alt="" />
                              </div>
                              <div>
                                <p className="text-[11px] font-bold leading-tight">{u.full_name || '—'}</p>
                                <p className="text-[8px] text-gray-600 mt-0.5">#{u.id?.slice(0, 6)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-[10px] text-gray-400 truncate max-w-[100px] hidden sm:table-cell">{u.email || '—'}</td>
                          <td className="py-4 px-5 hidden md:table-cell">
                            <span className={`px-2.5 py-1 rounded-lg text-[7px] font-black border uppercase tracking-wider ${
                              u.role === 'admin' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-gray-400 bg-zinc-800/60 border-white/[0.06]'
                            }`}>
                              {u.role || 'user'}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-center">
                            <span className="text-[12px] font-black text-purple-400">{u.game_count}</span>
                          </td>
                          <td className="py-4 px-5 text-center">
                            <button onClick={() => viewUserOrders(u.id, u.full_name || u.email)}
                              className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[7px] font-black text-blue-400 hover:bg-blue-500/20 transition-all uppercase tracking-wider md:opacity-0 md:group-hover:opacity-100">
                              Lihat
                            </button>
                          </td>
                          <td className="py-4 px-5 hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-purple-400 font-mono">{u.affiliate_code || '—'}</span>
                              <button onClick={() => {
                                const code = prompt('Set kode affiliate untuk ' + (u.full_name || u.email) + ':', u.affiliate_code || '')
                                if (code !== null && code.trim()) {
                                  supabase.from('profiles').update({ affiliate_code: code.trim() }).eq('id', u.id).then(({ error }) => {
                                    if (error) showToast('Error: ' + error.message, 'error')
                                    else { showToast('Kode affiliate diupdate!', 'success'); fetchUsers() }
                                  })
                                } else if (code !== null && code === '') {
                                  supabase.from('profiles').update({ affiliate_code: null }).eq('id', u.id).then(({ error }) => {
                                    if (error) showToast('Error: ' + error.message, 'error')
                                    else { showToast('Kode affiliate dihapus!', 'success'); fetchUsers() }
                                  })
                                }
                              }}
                                className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[7px] font-black text-purple-400 hover:bg-purple-500/20 transition-all uppercase tracking-wider md:opacity-0 md:group-hover:opacity-100">
                                Edit
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-[9px] font-bold text-gray-600 uppercase whitespace-nowrap hidden sm:table-cell">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 max-w-xl">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-6">Broadcast Message</p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Title</label>
                <input type="text" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all"
                  placeholder="e.g. Maintenance" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Message</label>
                <textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} rows={4}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white resize-none focus:border-purple-500/40 transition-all"
                  placeholder="Type your announcement..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Type</label>
                <div className="flex gap-2">
                  {['info', 'maintenance', 'new_game'].map(t => (
                    <button key={t} onClick={() => setBroadcastType(t)}
                      className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all active-scale ${
                        broadcastType === t
                          ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-600/20'
                          : 'bg-zinc-800/60 border border-white/[0.06] text-gray-400 hover:text-white'
                      }`}>
                      {t === 'info' ? 'Info' : t === 'maintenance' ? 'Maintenance' : 'New Game'}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={sendBroadcast} disabled={!broadcastTitle.trim() || !broadcastMessage.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-3.5 rounded-2xl hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300 active:scale-[0.98] text-[11px] tracking-[0.2em] uppercase disabled:opacity-50">
                Kirim Broadcast
              </button>
            </div>
          </div>
        )}

        

      {proofPreview && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4" onClick={() => setProofPreview(null)}>
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="bg-zinc-900/95 border border-white/[0.06] rounded-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black uppercase tracking-tight">Detail Pembayaran</h3>
                <button onClick={() => setProofPreview(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all active-scale">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-white/[0.03] rounded-3xl p-5 space-y-3 mb-5 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Game</span>
                  <span className="text-[11px] font-black uppercase">{proofPreview.games?.title || proofPreview.item_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Jumlah</span>
                  <span className="text-[11px] font-black">1</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">User</span>
                  <span className="text-[10px] font-bold text-right">{proofPreview.profiles?.full_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Tanggal</span>
                  <span className="text-[9px] font-bold text-gray-400">{new Date(proofPreview.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              <img src={proofPreview.payment_proof || proofPreview.proof_url} alt="Payment Proof" className="w-full rounded-2xl border border-white/[0.06]" />

              <a href={proofPreview.payment_proof || proofPreview.proof_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 mt-4 w-full px-5 py-4 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-[9px] font-black uppercase tracking-wider hover:bg-white/10 transition-all active-scale">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Gambar
              </a>
            </div>
          </div>
        </div>
      )}

      {userOrders && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4" onClick={() => setUserOrders(null)}>
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
          <div className="relative max-w-2xl w-full max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-zinc-900/95 border border-white/[0.06] rounded-3xl p-6 max-h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black uppercase tracking-tight">Orders: {userOrders.user}</h3>
                <button onClick={() => setUserOrders(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all active-scale">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {userOrdersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <span className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : userOrders.orders.length === 0 ? (
                <p className="text-center py-10 opacity-30 text-[10px] font-black uppercase italic">No orders found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[8px] text-gray-600 font-black uppercase tracking-widest">
                        <th className="pb-3 px-2">Game</th>
                        <th className="pb-3 px-2 text-right">Harga</th>
                        <th className="pb-3 px-2 text-center">Status</th>
                        <th className="pb-3 px-2">Tanggal</th>
                        <th className="pb-3 px-2 text-center">Bukti</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userOrders.orders.map(o => {
                        const proof = o.payment_proof || o.proof_url
                        return (
                        <tr key={o.id} className="hover:bg-white/[0.01] transition-all border-b border-white/[0.02]">
                          <td className="py-4 px-2">
                            <p className="text-[10px] font-black uppercase leading-tight">{o.games?.title || 'Unknown'}</p>
                          </td>
                          <td className="py-4 px-2 text-right text-[10px] font-black text-purple-400 whitespace-nowrap">—</td>
                          <td className="py-4 px-2 text-center">
                            <span className={`px-2 py-1 rounded text-[7px] font-black border uppercase ${
                              o.status === 'approved' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
                              o.status === 'pending' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' :
                              'text-red-500 bg-red-500/10 border-red-500/20'
                            }`}>{o.status === 'approved' ? 'success' : o.status}</span>
                          </td>
                          <td className="py-4 px-2 text-[8px] font-bold text-gray-600 uppercase whitespace-nowrap">
                            {new Date(o.created_at).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-4 px-2 text-center">
                            {proof ? (
                              <button onClick={() => { const name = userOrders.user; setUserOrders(null); setProofPreview({ ...o, profiles: { full_name: name } }) }}
                                className="px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[7px] font-black text-blue-400 hover:bg-blue-500/20 transition-all active-scale uppercase tracking-wider">
                                Lihat
                              </button>
                            ) : (
                              <span className="text-[8px] text-gray-600">-</span>
                            )}
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {activeTab === 'withdraw' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[9px] text-purple-400 font-black uppercase tracking-[0.3em]">Affiliate</p>
                <h2 className="text-2xl font-black italic uppercase tracking-tight">Withdraw Requests</h2>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">User</th>
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Jumlah</th>
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Metode</th>
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden md:table-cell">Detail</th>
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden sm:table-cell">Tanggal</th>
                      <th className="text-center py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Status</th>
                      <th className="text-center py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-16">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p className="text-[11px] text-gray-600 font-black uppercase tracking-wider">Belum ada request withdraw</p>
                      </td></tr>
                    ) : withdrawals.map(w => (
                      <tr key={w.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all">
                        <td className="py-4 px-5">
                          <p className="text-[11px] font-bold">{w.profiles?.full_name || '—'}</p>
                          <p className="text-[8px] text-gray-600">{w.profiles?.email || ''}</p>
                        </td>
                        <td className="py-4 px-5 text-[12px] font-black text-purple-400">{formatRupiah(w.amount)}</td>
                        <td className="py-4 px-5 text-[10px] font-bold">{w.method === 'dana' ? 'DANA' : w.method === 'gopay' ? 'GoPay' : 'OVO'}</td>
                        <td className="py-4 px-5 text-[9px] text-gray-400 max-w-[150px] truncate hidden md:table-cell">{w.account_details || '—'}</td>
                        <td className="py-4 px-5 text-[9px] text-gray-500 hidden sm:table-cell">{new Date(w.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="py-4 px-5 text-center">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-lg ${
                            w.status === 'approved' ? 'text-green-400 bg-green-500/10' :
                            w.status === 'rejected' ? 'text-red-400 bg-red-500/10' :
                            'text-yellow-400 bg-yellow-500/10'
                          }`}>
                            {w.status === 'approved' ? 'Dibayar' : w.status === 'rejected' ? 'Ditolak' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center">
                          {w.status === 'pending' && (
                            <div className="flex gap-1.5 justify-center">
                              <button onClick={() => approveWithdrawal(w)}
                                className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl text-[7px] font-black text-green-400 hover:bg-green-500/20 transition-all uppercase tracking-wider">
                                Approve
                              </button>
                              <button onClick={() => rejectWithdrawal(w)}
                                className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[7px] font-black text-red-400 hover:bg-red-500/20 transition-all uppercase tracking-wider">
                                Tolak
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total Logs', value: auditLogs.length, color: 'from-purple-600 to-purple-500', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { label: 'Hari Ini', value: auditLogs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length, color: 'from-blue-600 to-blue-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                { label: 'Unique Admin', value: [...new Set(auditLogs.map(l => l.admin_name))].length, color: 'from-emerald-600 to-emerald-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                { label: 'Aksi Terakhir', value: auditLogs[0]?.action?.replace(/_/g, ' ') || '-', color: 'from-amber-600 to-amber-500', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              ].map(card => (
                <div key={card.label} className="bg-zinc-900/60 border border-white/[0.04] rounded-2xl p-4 hover:border-white/[0.08] transition-all group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                      </svg>
                    </div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{card.label}</p>
                  </div>
                  <p className={`text-2xl font-black bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>{card.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
                <h2 className="text-xs font-black uppercase tracking-tight">Activity Log</h2>
                <button onClick={fetchAuditLogs} className="text-[8px] font-black text-purple-400 hover:text-purple-300 transition-all px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  Refresh
                </button>
              </div>
              <div className="overflow-auto max-h-[480px] no-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden md:table-cell">Waktu</th>
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Admin</th>
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Aksi</th>
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden lg:table-cell">Target</th>
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden xl:table-cell">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-16">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <p className="text-[11px] text-gray-600 font-black uppercase tracking-wider">No audit logs</p>
                      </td></tr>
                    ) : (
                      auditLogs.map((log, i) => (
                        <tr key={log.id} className={`border-b border-white/[0.02] hover:bg-white/[0.02] transition-all group ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                          <td className="py-4 px-5 text-[9px] text-gray-500 font-mono whitespace-nowrap hidden md:table-cell">
                            {new Date(log.created_at).toLocaleString('id-ID')}
                          </td>
                          <td className="py-4 px-5 text-[10px] font-bold whitespace-nowrap truncate max-w-[80px] sm:max-w-none">{log.admin_name}</td>
                          <td className="py-4 px-5">
                            <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border bg-purple-500/10 text-purple-400 border-purple-500/20">
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-[9px] text-gray-400 font-mono max-w-[130px] truncate hidden lg:table-cell" title={log.target_id}>
                            {log.target_type ? `${log.target_type}#${log.target_id?.slice(0, 8)}` : '-'}
                          </td>
                          <td className="py-4 px-5 text-[9px] text-gray-500 max-w-[220px] truncate hidden xl:table-cell" title={log.details ? JSON.stringify(log.details, null, 1) : ''}>
                            {log.details ? JSON.stringify(log.details).slice(0, 70) + (JSON.stringify(log.details).length > 70 ? '…' : '') : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left side: Chart */}
            <div className="lg:col-span-2">
              {stats.recentOrders.length > 0 ? (
                <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 h-[340px] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[9px] text-purple-400 font-black uppercase tracking-[0.2em]">Overview</p>
                      <h3 className="text-sm font-black uppercase tracking-tight">Order 7 Hari Terakhir</h3>
                    </div>
                    <button onClick={fetchStats} className="text-[8px] font-black text-purple-400 hover:text-purple-300 transition-all px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                      Refresh
                    </button>
                  </div>
                  <div className="flex-1 flex items-end gap-3 h-44 pb-2">
                    {(() => {
                      const maxCount = Math.max(...stats.recentOrders.map(o => o.count), 1)
                      return stats.recentOrders.map((o, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          <span className="text-[9px] text-gray-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{o.count} order</span>
                          <div className="w-full rounded-lg bg-gradient-to-t from-purple-600 to-purple-400 transition-all duration-500 hover:from-purple-500 hover:to-purple-300 cursor-pointer relative"
                            style={{ height: Math.max(10, (o.count / maxCount) * 80) + '%' }}>
                            <div className="absolute inset-0 bg-white/[0.03] rounded-lg" />
                          </div>
                          <span className="text-[8px] text-gray-500 font-black uppercase">{o.dateStr}</span>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 h-[340px] flex items-center justify-center">
                  <p className="text-[10px] text-gray-600 font-black uppercase italic">Tidak ada data order 7 hari terakhir</p>
                </div>
              )}
            </div>

            {/* Right side: KPI cards */}
            <div className="lg:col-span-1 grid grid-cols-2 gap-3 h-[340px]">
              {[
                { label: 'Total Game', value: stats.totalGames, color: 'from-blue-600 to-blue-500', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
                { label: 'Total User', value: stats.totalUsers, color: 'from-green-600 to-green-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                { label: 'Total Order', value: stats.totalOrders, color: 'from-purple-600 to-purple-500', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                { label: 'Sukses', value: stats.approvedOrders, color: 'from-emerald-600 to-emerald-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                { label: 'Pending', value: stats.pendingOrders, color: 'from-yellow-600 to-yellow-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                { label: 'Revenue', value: 'Rp ' + (stats.totalRevenue || 0).toLocaleString('id-ID'), color: 'from-pink-600 to-pink-500', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              ].map(card => (
                <div key={card.label} className="bg-zinc-900/60 border border-white/[0.04] rounded-2xl p-4 hover:border-white/[0.08] hover:-translate-y-0.5 transition-all group flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{card.label}</p>
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shrink-0`}>
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                      </svg>
                    </div>
                  </div>
                  <p className={`text-lg font-black bg-gradient-to-r ${card.color} bg-clip-text text-transparent truncate mt-2`} title={card.value}>{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
          </motion.div>

        </AnimatePresence>
        </div>
      </main>

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          variant={confirm.variant}
          inputMode={confirm.inputMode}
          inputPlaceholder={confirm.inputPlaceholder}
          onConfirm={confirm.onConfirm}
          onClose={() => setConfirm(null)}
        />
      )}

      {/* Admin Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-2xl border-t border-white/[0.04] pb-2">
        <div className="flex items-center justify-around py-1.5 px-1">
          {[
            { id: 'dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z', label: 'Inventory' },
            { id: 'orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', label: 'Orders', count: pendingOrders.length },
            { id: 'users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197', label: 'Users' },
            { id: 'chat', icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9', label: 'Chat' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-0.5 py-1 px-4 rounded-2xl transition-all ${
                activeTab === tab.id
                  ? 'text-purple-400 bg-purple-500/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              <span className="text-[7px] font-black uppercase tracking-wider">{tab.label}</span>
              {tab.count > 0 && (
                <span className="absolute -top-0.5 right-1.5 text-[7px] font-black min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-red-500/20 text-red-400">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
          <button onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-4 rounded-2xl transition-all text-gray-500 hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
            <span className="text-[7px] font-black uppercase tracking-wider">More</span>
          </button>
        </div>
      </div>

      {giveawayEntries && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4" onClick={() => setGiveawayEntries(null)}>
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
          <div className="relative max-w-lg w-full max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-zinc-900/95 border border-white/[0.06] rounded-3xl p-6 max-h-full overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black uppercase tracking-tight">Peserta Giveaway</h3>
                <button onClick={() => setGiveawayEntries(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all active-scale">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto no-scrollbar flex-1 space-y-2">
                {entriesLoading ? (
                  <p className="text-center py-10 text-[10px] text-gray-600 font-black uppercase tracking-widest">Loading...</p>
                ) : giveawayEntries.length === 0 ? (
                  <p className="text-center py-10 text-[10px] text-gray-600 font-black uppercase tracking-widest">Belum ada peserta</p>
                ) : (
                  giveawayEntries.map((entry, i) => (
                    <div key={entry.id} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] rounded-[16px] p-4">
                      <span className="w-6 h-6 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center text-[9px] font-black">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black uppercase truncate">{entry.profiles?.username || entry.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-[8px] text-gray-500 truncate">{entry.profiles?.email || ''}</p>
                      </div>
                      <span className="text-[7px] text-gray-600 font-bold">{new Date(entry.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
