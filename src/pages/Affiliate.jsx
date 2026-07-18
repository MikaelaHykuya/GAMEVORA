import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatRupiah } from '../lib/utils'
import { useToast } from '../contexts/ToastContext'
import Navbar from '../components/Navbar'

export default function Affiliate() {
  const { user, profile, ensureAffiliateCode } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [affiliateCode, setAffiliateCode] = useState('')
  const [referrals, setReferrals] = useState([])
  const [commissions, setCommissions] = useState([])
  const [stats, setStats] = useState({ totalReferrals: 0, totalEarned: 0, pendingCommissions: 0, paidCommissions: 0 })
  const [withdrawals, setWithdrawals] = useState([])
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState('dana')
  const [withdrawPhone, setWithdrawPhone] = useState('')
  const [withdrawName, setWithdrawName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState(null)
  const [gameRequests, setGameRequests] = useState([])
  const [availableGames, setAvailableGames] = useState([])
  const [requestGameId, setRequestGameId] = useState('')
  const [requestReason, setRequestReason] = useState('')
  const [requestingGame, setRequestingGame] = useState(false)
  const [currentTier, setCurrentTier] = useState(null)
  const [nextTier, setNextTier] = useState(null)
  const [settings, setSettings] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    init()
  }, [user])

  async function init() {
    setLoading(true)
    const code = await ensureAffiliateCode()
    setAffiliateCode(profile?.affiliate_code || code || '')

    const [referralsRes, commissionsRes, withdrawalsRes, tiersRes, settingsRes, leaderboardRes, appRes, gReqRes, gamesRes] = await Promise.all([
      supabase.from('affiliate_referrals').select('id, created_at, referred_id, profiles!inner(full_name, email)').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('affiliate_commissions').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('affiliate_withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('affiliate_tiers').select('*').order('rank_order', { ascending: true }),
      supabase.from('affiliate_settings').select('*').eq('id', 1).single(),
      supabase.from('profiles').select('id, full_name, email, total_earned, affiliate_tier_id, affiliate_tiers(name, color)').gt('total_earned', 0).order('total_earned', { ascending: false }).limit(10),
      supabase.from('affiliate_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('affiliate_game_requests').select('*, games(title, thumbnail)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('games').select('id, title').order('title', { ascending: true })
    ])

    setReferrals(referralsRes.data || [])
    setCommissions(commissionsRes.data || [])
    setWithdrawals(withdrawalsRes.data || [])
    if (settingsRes.data) setSettings(settingsRes.data)
    setLeaderboard(leaderboardRes.data || [])
    if (appRes.data) setApplication(appRes.data)
    setGameRequests(gReqRes.data || [])
    setAvailableGames(gamesRes.data || [])

    const totalEarned = (commissionsRes.data || []).reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0)
    const pendingCommissions = (commissionsRes.data || []).filter(c => c.status === 'pending').reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0)
    const paidCommissions = (commissionsRes.data || []).filter(c => c.status === 'paid').reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0)

    setStats({
      totalReferrals: (referralsRes.data || []).length,
      totalEarned,
      pendingCommissions,
      paidCommissions,
    })

    const tiers = tiersRes.data || []
    if (tiers.length > 0) {
      let activeTier = tiers[0]
      if (profile?.affiliate_tier_id) {
        activeTier = tiers.find(t => t.id === profile.affiliate_tier_id) || tiers[0]
      }
      setCurrentTier(activeTier)
      const next = tiers.find(t => t.rank_order > activeTier.rank_order)
      setNextTier(next || null)
    }

    setLoading(false)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(affiliateCode)
    showToast('Kode affiliate disalin!', 'success')
  }

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount)
    const minW = Number(settings?.min_withdraw) || 50000
    if (!amount || amount < minW) return showToast(`Minimal withdraw ${formatRupiah(minW)}`, 'warning')
    if (amount > (profile?.commission_balance || 0)) return showToast('Saldo tidak mencukupi!', 'error')
    if (!withdrawPhone.trim()) return showToast('Isi nomor HP e-wallet!', 'warning')
    if (!withdrawName.trim()) return showToast('Isi atas nama!', 'warning')
    setSubmitting(true)
    const { error } = await supabase.from('affiliate_withdrawals').insert({
      user_id: user.id,
      amount,
      method: withdrawMethod,
      account_details: `${withdrawName.trim()} - ${withdrawPhone.trim()}`,
    })
    if (error) { showToast('Gagal: ' + error.message, 'error') }
    else {
      showToast('Permintaan withdraw dikirim! Menunggu verifikasi admin.', 'success')
      
      // Notify Admins
      const sender = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Affiliate'
      const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
      supabase.functions.invoke('send-push', { 
        body: { 
          title: `Request Withdraw Baru 💰`, 
          message: `${sender} merequest penarikan komisi sebesar ${formatRupiah(amount)}.`, 
          is_admin: true 
        } 
      }).catch(console.error)
      setWithdrawAmount('')
      setWithdrawPhone('')
      setWithdrawName('')
      const { data: newProfile } = await supabase.from('profiles').select('commission_balance').eq('id', user.id).single()
      if (newProfile) profile.commission_balance = newProfile.commission_balance
      const { data: newWithdrawals } = await supabase.from('affiliate_withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setWithdrawals(newWithdrawals || [])
    }
    setSubmitting(false)
  }

  const handleRequestGame = async () => {
    if (!requestGameId) return showToast('Pilih game', 'warning')
    if (!requestReason.trim()) return showToast('Isi alasan request (contoh: untuk promosi di YouTube)', 'warning')
    setRequestingGame(true)
    const { data, error } = await supabase.from('affiliate_game_requests').insert({
      user_id: user.id,
      game_id: requestGameId,
      reason: requestReason.trim()
    }).select('*, games(title, thumbnail)').single()

    if (error) {
      showToast('Gagal request: ' + error.message, 'error')
    } else {
      showToast('Request game berhasil dikirim', 'success')
      setGameRequests([data, ...gameRequests])
      setRequestGameId('')
      setRequestReason('')
      
      const sender = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Affiliate'
      supabase.functions.invoke('send-push', { 
        body: { 
          title: `Request Promo Game 🎮`, 
          message: `${sender} merequest game untuk dipromosikan.`, 
          is_admin: true 
        } 
      }).catch(console.error)
    }
    setRequestingGame(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-[3px] border-purple-500/20 rounded-full animate-ping" />
          <div className="absolute inset-1 border-[3px] border-transparent border-t-purple-500 rounded-full animate-spin" />
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 animate-pulse">Loading Vault...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>Affiliate | GVR</title><meta name="description" content="Affiliate GVR - bagikan kode affiliate dan dapatkan komisi." /></Helmet>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] bg-emerald-600/5 rounded-full blur-[100px] animate-float" />
      </div>

      <Navbar />
      <main className="pt-28 px-4 md:px-6 max-w-5xl mx-auto pb-8 relative">

        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-600/30 via-purple-600/5 to-transparent rounded-[32px] blur-xl transition-all duration-700 opacity-50 group-hover:opacity-100" />
          <div className="relative bg-zinc-900/40 border border-white/[0.08] rounded-[32px] overflow-hidden backdrop-blur-2xl shadow-2xl">
            <div className={`h-32 md:h-48 bg-gradient-to-r ${currentTier ? currentTier.color.replace('text-', 'from-') + '/40' : 'from-purple-900/40'} via-purple-900/20 to-transparent relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-900/90 to-transparent" />
            </div>
            <div className="px-6 md:px-10 pb-10 -mt-20 relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
              
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                <div className={`relative w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-gradient-to-br ${currentTier ? currentTier.color.replace('text-', 'from-').replace('-400', '-600') + ' to-zinc-900' : 'from-zinc-800 to-black'} p-1 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] transform transition-transform duration-500 hover:scale-105 hover:rotate-3`}>
                  <div className="absolute inset-0 bg-white/20 blur-md opacity-0 hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-full h-full bg-zinc-900/90 backdrop-blur-2xl rounded-[20px] flex items-center justify-center flex-col gap-1 border border-white/20 relative z-10">
                    <span className="text-4xl md:text-5xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{currentTier?.icon || '🎮'}</span>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${currentTier?.color || 'text-gray-400'}`}>Rank {currentTier?.rank_order || 1}</span>
                  </div>
                </div>
                
                <div className="pb-2">
                  <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                    <h1 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter filter drop-shadow-md ${currentTier?.color || 'text-white'}`}>{currentTier?.name || 'Beginner'}</h1>
                    <div className="px-2.5 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 backdrop-blur-md">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-green-400">Active</span>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-gray-400 font-bold tracking-widest uppercase">
                    Komisi Anda saat ini: <span className="text-white bg-white/10 px-2 py-0.5 rounded-lg border border-white/10 ml-1">{currentTier?.commission_rate || 10}%</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[240px] bg-black/60 backdrop-blur-xl p-5 rounded-[24px] border border-white/[0.08] shadow-2xl">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-400">Next: <span className="text-white">{nextTier?.name || 'Max Level'}</span></span>
                  <span className={nextTier?.color || 'text-gray-500'}>
                    {stats.totalReferrals} / {nextTier?.min_sales || '∞'}
                  </span>
                </div>
                <div className="h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/5 relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20" />
                  <div className={`h-full ${nextTier ? nextTier.color.replace('text-', 'bg-') : 'bg-gray-500'} rounded-full transition-all duration-1000 relative overflow-hidden`} 
                    style={{ 
                      width: nextTier ? (
                        `${Math.min(100, (stats.totalReferrals / nextTier.min_sales) * 100)}%`
                      ) : '100%' 
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center mt-1">
                  {nextTier ? `Butuh ${nextTier.min_sales - stats.totalReferrals} penjualan lagi` : 'Rank Tertinggi!'}
                </p>
                <Link to="/affiliate/benefits" className="text-[9px] text-center text-purple-400 hover:text-purple-300 mt-1 font-black uppercase tracking-widest transition-colors">
                  Lihat Detail Benefit &rarr;
                </Link>
              </div>

            </div>
          </div>
        </div>

        {affiliateCode ? (
          <div className="bg-zinc-900/40 border border-green-500/20 rounded-3xl p-6 mb-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/5 rounded-full blur-[50px] -mr-10 -mt-10 group-hover:bg-green-500/10 transition-all" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Your Affiliate Code</span>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/5 rounded-2xl" />
                  <input type="text" readOnly value={affiliateCode}
                    className="w-full bg-zinc-900/80 border border-green-500/30 rounded-2xl px-5 py-4 text-base md:text-lg outline-none text-white font-black tracking-[0.3em] uppercase text-center md:text-left" />
                </div>
                <button onClick={copyCode}
                  className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black px-8 rounded-2xl text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-green-600/30 transition-all shrink-0 hover:-translate-y-0.5 active:scale-95">
                  <span className="hidden md:inline">Salin Kode</span>
                  <span className="md:hidden">Salin</span>
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
                Bagikan kode <span className="text-green-400 font-black font-mono tracking-wider">{affiliateCode}</span> ke temanmu! Mereka dapat <span className="text-green-400 font-black">diskon 10%</span> saat checkout & kamu dapat <span className="text-green-400 font-black">komisi {currentTier?.commission_rate || 10}%</span> dari transaksinya.
              </p>
            </div>
          </div>
        ) : application?.status === 'pending' ? (
          <div className="bg-zinc-900/40 border border-yellow-500/20 rounded-3xl p-8 mb-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-black uppercase tracking-tight text-gray-300 mb-1">Pengajuan Sedang Diproses</p>
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Admin sedang meninjau pengajuan affiliate kamu.</p>
          </div>
        ) : (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-8 mb-8 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 11V9a2 2 0 00-2-2m2 4v4a2 2 0 104 0v-1m-4-3H9m2 0h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-black uppercase tracking-tight text-white mb-1">Kode Affiliate Belum Tersedia</p>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-6">Dapatkan komisi dari setiap penjualan menggunakan kode unikmu.</p>
            
            {application?.status === 'rejected' && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-6 text-left">
                <strong>Pengajuan sebelumnya ditolak.</strong> Kamu bisa mencoba mengajukan ulang.
              </div>
            )}

            <Link to="/affiliate/apply" className="inline-block bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-black px-8 py-4 rounded-xl text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-blue-600/30 transition-all hover:-translate-y-0.5 active:scale-95">
              Ajukan Affiliate Sekarang
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Referrals', value: stats.totalReferrals, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'from-blue-600 to-indigo-500', shadow: 'shadow-blue-500/20' },
            { label: 'Total Earned', value: formatRupiah(stats.totalEarned), icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-emerald-500 to-green-500', shadow: 'shadow-green-500/20' },
            { label: 'Pending', value: formatRupiah(stats.pendingCommissions), icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-orange-500 to-yellow-500', shadow: 'shadow-yellow-500/20' },
            { label: 'Paid Out', value: formatRupiah(stats.paidCommissions), icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-purple-500 to-pink-500', shadow: 'shadow-purple-500/20' },
          ].map((s, i) => (
            <div key={i} className="group bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-5 md:p-6 hover:bg-zinc-900/60 transition-all duration-500 relative overflow-hidden backdrop-blur-md">
              <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${s.color} opacity-10 rounded-full blur-[30px] group-hover:opacity-20 group-hover:scale-150 transition-all duration-700`} />
              
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 shadow-lg ${s.shadow} transform group-hover:-translate-y-1 transition-transform duration-300`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </div>
              
              <div className="relative z-10">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">{s.label}</p>
                <p className="text-xl md:text-2xl font-black text-white tracking-tight">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900/40 border border-white/[0.04] rounded-[32px] p-6 md:p-8 mb-10 relative overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-green-400">Withdraw Saldo</h2>
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tarik komisi ke e-wallet favoritmu</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl px-6 py-4 flex flex-col items-end shadow-lg shadow-green-500/5">
              <span className="text-[9px] text-green-500/80 font-black uppercase tracking-widest mb-1">Available Balance</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white tracking-tighter">{formatRupiah(profile?.commission_balance || 0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/[0.04] rounded-2xl p-5 md:p-6 mb-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Jumlah Tarik</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">Rp</span>
                  <input type="number" min={Number(settings?.min_withdraw) || 50000} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                    className="w-full bg-zinc-900/80 border border-white/[0.08] rounded-xl pl-10 pr-4 py-3.5 text-sm outline-none text-white focus:border-green-500/50 focus:bg-zinc-900 transition-all font-bold"
                    placeholder={`Min ${Number(settings?.min_withdraw) || 50000}`} />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Pilih E-Wallet</label>
                <div className="relative">
                  <select value={withdrawMethod} onChange={e => setWithdrawMethod(e.target.value)}
                    className="w-full bg-zinc-900/80 border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm outline-none text-white focus:border-green-500/50 focus:bg-zinc-900 transition-all appearance-none cursor-pointer font-bold uppercase tracking-wider">
                    <option value="dana">DANA</option>
                    <option value="gopay">GoPay</option>
                    <option value="ovo">OVO</option>
                  </select>
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Nomor HP</label>
                <input type="text" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm outline-none text-white focus:border-green-500/50 focus:bg-zinc-900 transition-all font-mono"
                  placeholder="08xxxxxxxxxx" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Nama Pemilik</label>
                <input type="text" value={withdrawName} onChange={e => setWithdrawName(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm outline-none text-white focus:border-green-500/50 focus:bg-zinc-900 transition-all font-bold"
                  placeholder="Sesuai aplikasi" />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button onClick={handleWithdraw} disabled={submitting}
                className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black px-10 py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all duration-300 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3">
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Tarik Dana Sekarang
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </div>
          </div>

          {withdrawals.length > 0 && (
            <div className="relative z-10">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2 ml-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Riwayat Transaksi
              </h3>
              <div className="space-y-3">
                {withdrawals.map(w => (
                  <div key={w.id} className="group flex flex-col md:flex-row md:items-center justify-between bg-zinc-900/40 border border-white/[0.02] hover:border-white/[0.08] hover:bg-zinc-900/60 rounded-2xl p-4 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-3 md:mb-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                        w.status === 'approved' ? 'bg-green-500/10 text-green-400 shadow-green-500/10' :
                        w.status === 'rejected' ? 'bg-red-500/10 text-red-400 shadow-red-500/10' : 
                        'bg-yellow-500/10 text-yellow-400 shadow-yellow-500/10'
                      }`}>
                        {w.status === 'approved' ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        ) : w.status === 'rejected' ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-black text-white tracking-tight">{formatRupiah(w.amount)}</p>
                        <p className="text-[9px] text-gray-500 font-bold tracking-widest mt-0.5 flex items-center gap-2">
                          <span className="uppercase text-white/70">{w.method}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-600" />
                          <span>{w.account_details}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end md:gap-6 ml-14 md:ml-0">
                      <span className="text-[9px] text-gray-500 font-mono tracking-widest">{new Date(w.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border ${
                        w.status === 'approved' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                        w.status === 'rejected' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                        'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                      }`}>
                        {w.status === 'approved' ? 'Berhasil' : w.status === 'rejected' ? 'Ditolak' : 'Diproses'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Referral Saya</h2>
              <span className="text-[9px] text-gray-600 font-bold ml-auto">{referrals.length} orang</span>
            </div>
            {referrals.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Belum ada referral</p>
                <p className="text-[8px] text-gray-700 font-bold uppercase tracking-widest mt-1">Bagikan kode kamu untuk mulai</p>
              </div>
            ) : (
              <div className="space-y-2">
                {referrals.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-zinc-900/30 rounded-xl px-4 py-3 hover:bg-zinc-900/50 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[9px] font-black shrink-0">
                        {(r.profiles?.full_name || '?')[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{r.profiles?.full_name || 'Pengguna'}</p>
                        <p className="text-[8px] text-gray-500 font-mono truncate">{r.profiles?.email}</p>
                      </div>
                    </div>
                    <span className="text-[8px] text-gray-600 font-bold whitespace-nowrap ml-2">{new Date(r.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-purple-400">Riwayat Komisi</h2>
              <span className="text-[9px] text-gray-600 font-bold ml-auto">{commissions.length} transaksi</span>
            </div>
            {commissions.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Belum ada komisi</p>
                <p className="text-[8px] text-gray-700 font-bold uppercase tracking-widest mt-1">Komisi muncul setelah temanmu bertransaksi</p>
              </div>
            ) : (
              <div className="space-y-2">
                {commissions.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-zinc-900/30 rounded-xl px-4 py-3 hover:bg-zinc-900/50 transition-all">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{c.game_title || 'Pembelian'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          c.status === 'paid' ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'
                        }`}>
                          {c.status === 'paid' ? 'Dibayar' : 'Pending'}
                        </span>
                        <span className="text-[8px] text-gray-600">{new Date(c.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                    <p className={`text-sm font-black ml-3 ${c.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                      +{formatRupiah(c.commission_amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="bg-zinc-900/40 border border-white/[0.04] rounded-[32px] p-6 md:p-8 mt-10 relative overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/[0.04] pb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/20 blur-md rounded-2xl" />
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30 relative z-10 border border-yellow-300/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white filter drop-shadow-md">Top Affiliates</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Peringkat Pendapatan Tertinggi</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto relative z-10 custom-scrollbar pb-2">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">
                  <th className="pb-4 px-4 w-16 text-center">Rank</th>
                  <th className="pb-4 px-4">Affiliate</th>
                  <th className="pb-4 px-4 text-right">Total Earned</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-12 text-center">
                      <p className="text-xs font-black uppercase tracking-widest text-gray-600">Belum ada data</p>
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((u, i) => {
                    const isTop1 = i === 0
                    const isTop2 = i === 1
                    const isTop3 = i === 2
                    
                    return (
                      <tr key={u.id} className={`group transition-all duration-300 ${
                        isTop1 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent hover:from-yellow-500/20' : 
                        isTop2 ? 'bg-gradient-to-r from-gray-300/10 to-transparent hover:from-gray-300/20' :
                        isTop3 ? 'bg-gradient-to-r from-amber-700/10 to-transparent hover:from-amber-700/20' : 
                        'bg-zinc-900/40 hover:bg-zinc-900/60'
                      }`}>
                        <td className="py-4 px-4 text-center rounded-l-2xl">
                          <div className={`relative w-8 h-8 mx-auto rounded-xl flex items-center justify-center text-xs font-black transform group-hover:scale-110 transition-transform ${
                            isTop1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_20px_rgba(234,179,8,0.6)] border border-yellow-200/50' : 
                            isTop2 ? 'bg-gradient-to-br from-gray-200 to-gray-500 text-black shadow-[0_0_15px_rgba(209,213,219,0.4)] border border-gray-100/50' :
                            isTop3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-[0_0_15px_rgba(180,83,9,0.5)] border border-amber-500/50' : 
                            'bg-white/5 text-gray-400 border border-white/10'
                          }`}>
                            {i + 1}
                            {isTop1 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping opacity-50" />}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className={`text-sm md:text-base font-black truncate tracking-tight ${u.id === user.id ? 'text-purple-400' : 'text-white'}`}>
                            {u.full_name || u.email?.split('@')[0]}
                            {u.id === user.id && <span className="ml-3 text-[9px] font-black tracking-[0.2em] bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30 uppercase align-middle">You</span>}
                          </p>
                          {u.affiliate_tiers && (
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${u.affiliate_tiers.color || 'text-gray-500'}`}>
                              {u.affiliate_tiers.name}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right rounded-r-2xl">
                          <span className={`text-sm md:text-base font-black tracking-tighter ${
                            isTop1 ? 'text-yellow-400' : 
                            isTop2 ? 'text-gray-300' : 
                            isTop3 ? 'text-amber-500' : 
                            'text-green-400'
                          }`}>
                            {formatRupiah(u.total_earned)}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Promo Game Request Section (Only for active affiliates) */}
        {affiliateCode && (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-[32px] p-6 md:p-8 mt-10 relative overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/[0.04] pb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-2xl" />
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 relative z-10 border border-purple-400/30">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white filter drop-shadow-md">Promo Game Request</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5 max-w-sm">Dapatkan akses game gratis untuk keperluan promosi konten Anda</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="bg-black/30 border border-white/[0.04] rounded-2xl p-5 md:p-6 h-fit">
                <div className="space-y-5">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 block mb-2 ml-1">Pilih Game</label>
                    <div className="relative">
                      <select value={requestGameId} onChange={e => setRequestGameId(e.target.value)}
                        className="w-full bg-zinc-900/80 border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm outline-none text-white focus:border-purple-500/50 focus:bg-zinc-900 transition-all appearance-none cursor-pointer font-bold">
                        <option value="">-- Pilih Game dari Vault --</option>
                        {availableGames.map(g => (
                          <option key={g.id} value={g.id}>{g.title}</option>
                        ))}
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 block mb-2 ml-1">Alasan / Rencana Promosi</label>
                    <textarea value={requestReason} onChange={e => setRequestReason(e.target.value)}
                      className="w-full bg-zinc-900/80 border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm outline-none text-white focus:border-purple-500/50 focus:bg-zinc-900 transition-all h-28 resize-none font-medium leading-relaxed"
                      placeholder="Contoh: Untuk live streaming TikTok malam ini dan review YouTube..." />
                  </div>
                  <button onClick={handleRequestGame} disabled={requestingGame}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-500 text-white font-black px-6 py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3">
                    {requestingGame ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Mengirim Request...
                      </>
                    ) : (
                      <>
                        Kirim Request
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 block ml-1 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Riwayat Request
                </h3>
                <div className="space-y-3 h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  {gameRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-white/[0.04] border-dashed rounded-2xl bg-zinc-900/10">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Belum ada request</p>
                    </div>
                  ) : (
                    gameRequests.map(r => (
                      <div key={r.id} className="group bg-zinc-900/40 border border-white/[0.02] hover:border-white/[0.08] hover:bg-zinc-900/60 rounded-2xl p-4 flex flex-col transition-all duration-300">
                        <div className="flex justify-between items-start mb-3 gap-4">
                          <p className="text-sm font-black text-white truncate group-hover:text-purple-400 transition-colors">{r.games?.title}</p>
                          <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-md shrink-0 border ${
                            r.status === 'approved' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                            r.status === 'rejected' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                            'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                          }`}>
                            {r.status === 'approved' ? 'Disetujui' : r.status === 'rejected' ? 'Ditolak' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/[0.02]">{r.reason}</p>
                        <p className="text-[8px] text-gray-600 mt-3 font-mono tracking-widest uppercase">{new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
