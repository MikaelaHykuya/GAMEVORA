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
import AdminInventory from './admin/AdminInventory'
import AdminUpload from './admin/AdminUpload'
import AdminOrders from './admin/AdminOrders'
import AdminUsers from './admin/AdminUsers'
import AdminRequests from './admin/AdminRequests'
import AdminChat from './admin/AdminChat'
import AdminBroadcast from './admin/AdminBroadcast'
import AdminGiveaway from './admin/AdminGiveaway'
import AdminRefund from './admin/AdminRefund'
import AdminMaintenance from './admin/AdminMaintenance'
import AdminWithdraw from './admin/AdminWithdraw'
import AdminAudit from './admin/AdminAudit'
import AdminStats from './admin/AdminStats'

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
      const { error } = await supabase.from('audit_logs').insert([{
        admin_id: user?.id,
        admin_name: profile?.full_name || 'Admin',
        action,
        target_type: targetType,
        target_id: targetId,
        details,
      }])
      if (error) console.error('Log error:', error)
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
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
    if (error) { console.error('Fetch audit logs error:', error); return }
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
        const { data: gameRow } = await supabase.from('games').select('sold_count').eq('id', order.game_id).single()
        if (gameRow) await supabase.from('games').update({ sold_count: (gameRow.sold_count || 0) + 1 }).eq('id', order.game_id)
        logAdminAction('approve_order', 'library', order.id, { item_name: order.item_name, user_id: order.user_id })
        const title = 'Payment Approved'
        const message = `Pembayaran untuk ${order.item_name} telah diverifikasi. Game tersedia di vault Anda.`
        await supabase.from('vault_notifications').insert([{ user_id: order.user_id, title, message }])
        supabase.functions.invoke('send-push', { body: { title, message, target_user_id: order.user_id } }).catch(console.error)

        let referrerId = order.voucher_owner_id
        if (!referrerId) {
          const { data: referral } = await supabase.from('affiliate_referrals').select('referrer_id').eq('referred_id', order.user_id).maybeSingle()
          if (referral) referrerId = referral.referrer_id
        }
        if (referrerId) {
          const orderAmount = Number(order.games?.discount_price || order.games?.price || 0)
          const commissionAmount = Math.floor(orderAmount * 10 / 100)
          if (commissionAmount > 0) {
            await supabase.from('affiliate_commissions').insert({
              referral_id: null,
              referrer_id: referrerId,
              order_id: order.id,
              game_title: order.item_name,
              order_amount: orderAmount,
              commission_amount: commissionAmount,
              status: 'pending',
            })
            const { data: referrerProfile } = await supabase.from('profiles').select('commission_balance, total_earned').eq('id', referrerId).single()
            if (referrerProfile) {
              await supabase.from('profiles').update({
                commission_balance: (referrerProfile.commission_balance || 0) + commissionAmount,
                total_earned: (referrerProfile.total_earned || 0) + commissionAmount,
              }).eq('id', referrerId)
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
      sold_count: g.sold_count || 0,
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
      title: '', genre: 'Action', price: 0, discount_price: 0, sold_count: 0,
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
      sold_count: Number(form.sold_count),
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
    if (file.size > 100 * 1024 * 1024) return showToast('File maksimal 100MB', 'warning')
    
    setUploadingZip(true)
    const gameName = form.title ? form.title.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase() : 'untitled'
    const fileName = `GV-${gameName}.zip`
    const filePath = `voratools/${fileName}`

    try {
      const { error: uploadError } = await supabase.storage.from('game-assets').upload(filePath, file, { upsert: true })
      if (uploadError) {
        if (uploadError.message?.includes('bucket') || uploadError.statusCode === 404) {
          const { error: createError } = await supabase.storage.createBucket('game-assets', { public: true })
          if (createError) throw new Error('Bucket "game-assets" tidak ada dan gagal dibuat. Buat manual di Supabase Dashboard.')
          const { error: retryError } = await supabase.storage.from('game-assets').upload(filePath, file, { upsert: true })
          if (retryError) throw retryError
        } else {
          throw uploadError
        }
      }
      const { data } = supabase.storage.from('game-assets').getPublicUrl(filePath)
      setForm({ ...form, voratools_link: data.publicUrl })
      showToast('ZIP berhasil diupload!', 'success')
    } catch (err) {
      showToast('Gagal upload ZIP: ' + err.message, 'error')
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
      <main className={`min-h-screen transition-all duration-300 ${'md:ml-64'} pt-0 pb-8 relative`}>
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
            {activeTab === 'dashboard' && <AdminInventory games={games} searchGames={searchGames} setSearchGames={setSearchGames} newGame={newGame} prepareEdit={prepareEdit} deleteGame={deleteGame} formatRupiah={formatRupiah} pendingNewGameCount={pendingNewGameCount} sendPendingGames={sendPendingGames} users={users} pendingOrders={pendingOrders} refundRequests={refundRequests} requests={requests} />}

        {activeTab === 'upload' && <AdminUpload editId={editId} form={form} setForm={setForm} downloadLinks={downloadLinks} setDownloadLinks={setDownloadLinks} handleZipUpload={handleZipUpload} uploadingZip={uploadingZip} saveGame={saveGame} />}



        {activeTab === 'requests' && <AdminRequests requests={requests} searchRequests={searchRequests} setSearchRequests={setSearchRequests} updateRequestStatus={updateRequestStatus} />}

        {activeTab === 'chat' && <AdminChat chatUsers={chatUsers} selectedChat={selectedChat} setSelectedChat={setSelectedChat} chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput} sendChatReply={sendChatReply} loadChatMessages={loadChatMessages} />}

        {activeTab === 'giveaway' && <AdminGiveaway giveaways={giveaways} giveawayTitle={giveawayTitle} setGiveawayTitle={setGiveawayTitle} giveawayDesc={giveawayDesc} setGiveawayDesc={setGiveawayDesc} giveawayGameId={giveawayGameId} setGiveawayGameId={setGiveawayGameId} giveawayWinners={giveawayWinners} setGiveawayWinners={setGiveawayWinners} giveawayDuration={giveawayDuration} setGiveawayDuration={setGiveawayDuration} games={games} createGiveaway={createGiveaway} endingGiveaway={endingGiveaway} endGiveaway={endGiveaway} giveawayEntries={giveawayEntries} entriesLoading={entriesLoading} viewGiveawayEntries={viewGiveawayEntries} setGiveawayEntries={setGiveawayEntries} />}

        {activeTab === 'refund' && <AdminRefund refundRequests={refundRequests} approveRefund={approveRefund} rejectRefund={rejectRefund} />}

        {activeTab === 'maintenance' && <AdminMaintenance maintenance={maintenance} maintenanceMessage={maintenanceMessage} localMaintenanceMsg={localMaintenanceMsg} setLocalMaintenanceMsg={setLocalMaintenanceMsg} toggleMaintenance={toggleMaintenance} setConfirm={setConfirm} logAdminAction={logAdminAction} />}

        {activeTab === 'orders' && <AdminOrders pendingOrders={pendingOrders} setProofPreview={setProofPreview} approveOrder={approveOrder} rejectOrder={rejectOrder} />}

        {activeTab === 'users' && <AdminUsers users={users} searchUsers={searchUsers} setSearchUsers={setSearchUsers} getAvatarUrl={getAvatarUrl} viewUserOrders={viewUserOrders} fetchUsers={fetchUsers} />}

        {activeTab === 'broadcast' && <AdminBroadcast broadcastTitle={broadcastTitle} setBroadcastTitle={setBroadcastTitle} broadcastMessage={broadcastMessage} setBroadcastMessage={setBroadcastMessage} broadcastType={broadcastType} setBroadcastType={setBroadcastType} sendBroadcast={sendBroadcast} />}

        

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

        {activeTab === 'withdraw' && <AdminWithdraw withdrawals={withdrawals} formatRupiah={formatRupiah} approveWithdrawal={approveWithdrawal} rejectWithdrawal={rejectWithdrawal} />}

        {activeTab === 'audit' && <AdminAudit auditLogs={auditLogs} fetchAuditLogs={fetchAuditLogs} />}

        {activeTab === 'stats' && <AdminStats stats={stats} fetchStats={fetchStats} />}
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

      {/* Admin Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-3 mb-3 bg-zinc-900/80 backdrop-blur-3xl border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/50">
          <div className="flex items-center justify-around py-2 px-2">
            {[
              { id: 'dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', label: 'Inventory' },
              { id: 'orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Orders', count: pendingOrders.length },
              { id: 'users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'Users' },
              { id: 'chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Chat' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-purple-400 bg-purple-500/15'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}>
                {activeTab === tab.id && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-purple-400 rounded-full" />
                )}
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                <span className="text-[8px] font-bold uppercase tracking-widest">{tab.label}</span>
                {tab.count > 0 && (
                  <span className="absolute top-1 right-2 text-[7px] font-black min-w-[15px] h-[15px] flex items-center justify-center rounded-full bg-red-500 text-white">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
            <button onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 text-zinc-500 hover:text-zinc-300 hover:bg-white/5">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-[8px] font-bold uppercase tracking-widest">Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
