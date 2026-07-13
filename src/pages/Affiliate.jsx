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

    const [referralsRes, commissionsRes, withdrawalsRes, tiersRes, settingsRes, leaderboardRes] = await Promise.all([
      supabase.from('affiliate_referrals').select('id, created_at, referred_id, profiles!inner(full_name, email)').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('affiliate_commissions').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('affiliate_withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('affiliate_tiers').select('*').order('rank_order', { ascending: true }),
      supabase.from('affiliate_settings').select('*').eq('id', 1).single(),
      supabase.from('profiles').select('id, full_name, email, total_earned, affiliate_tier_id, affiliate_tiers(name, color)').gt('total_earned', 0).order('total_earned', { ascending: false }).limit(10)
    ])

    setReferrals(referralsRes.data || [])
    setCommissions(commissionsRes.data || [])
    setWithdrawals(withdrawalsRes.data || [])
    if (settingsRes.data) setSettings(settingsRes.data)
    setLeaderboard(leaderboardRes.data || [])

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
    showToast('Kode voucher disalin!', 'success')
  }

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount)
    const minW = settings?.min_withdraw || 50000
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
      <Helmet><title>Kode Voucher | GVR</title><meta name="description" content="Kode voucher GVR - bagikan kode voucher dan dapatkan komisi." /></Helmet>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] bg-emerald-600/5 rounded-full blur-[100px] animate-float" />
      </div>

      <Navbar />
      <main className="pt-28 px-4 md:px-6 max-w-5xl mx-auto pb-8 relative">

        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 via-transparent to-transparent rounded-[32px]" />
          <div className="relative bg-zinc-900/60 border border-white/[0.04] rounded-[32px] overflow-hidden backdrop-blur-xl">
            <div className={`h-32 md:h-40 bg-gradient-to-r ${currentTier ? currentTier.color.replace('text-', 'from-') + '/40' : 'from-purple-900/40'} via-transparent to-transparent relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-zinc-900 to-transparent" />
            </div>
            <div className="px-6 md:px-8 pb-8 -mt-16 relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              
              <div className="flex items-end gap-5">
                <div className={`w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br ${currentTier ? currentTier.color.replace('text-', 'from-').replace('-400', '-600') + ' to-black' : 'from-zinc-800 to-black'} p-1 overflow-hidden shadow-2xl`}>
                  <div className="w-full h-full bg-zinc-900/80 backdrop-blur-xl rounded-[20px] flex items-center justify-center flex-col gap-1 border border-white/10">
                    <span className="text-3xl">{currentTier?.icon || '🎮'}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${currentTier?.color || 'text-gray-400'}`}>Rank {currentTier?.rank_order || 1}</span>
                  </div>
                </div>
                
                <div className="pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className={`text-3xl md:text-4xl font-black uppercase tracking-tight ${currentTier?.color || 'text-white'}`}>{currentTier?.name || 'Beginner'}</h1>
                    <div className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-gray-300">Active</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 font-bold tracking-wider">
                    Komisi Anda saat ini: <span className="text-white">{currentTier?.commission_rate || 10}%</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-[200px] bg-black/40 p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-500">Progress to {nextTier?.name || 'Max'}</span>
                  <span className={nextTier?.color || 'text-gray-500'}>
                    {settings?.tier_metric === 'sales' ? `${stats.totalReferrals}/${nextTier?.min_sales || 0} Sales` : `${formatRupiah(stats.totalEarned)} / ${formatRupiah(nextTier?.min_omzet || 0)}`}
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${nextTier ? nextTier.color.replace('text-', 'bg-') : 'bg-gray-500'} rounded-full transition-all duration-1000`} 
                    style={{ 
                      width: nextTier ? (
                        settings?.tier_metric === 'sales' 
                          ? `${Math.min(100, (stats.totalReferrals / nextTier.min_sales) * 100)}%` 
                          : `${Math.min(100, (stats.totalEarned / nextTier.min_omzet) * 100)}%`
                      ) : '100%' 
                    }} 
                  />
                </div>
                <Link to="/affiliate/benefits" className="text-[8px] text-gray-400 hover:text-white mt-1 underline decoration-white/20 underline-offset-4 transition-colors">
                  Lihat detail benefit tier &rarr;
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
                <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Your Voucher Code</span>
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
                Bagikan kode <span className="text-green-400 font-black font-mono tracking-wider">{affiliateCode}</span> ke temanmu! Mereka dapat <span className="text-green-400 font-black">diskon 10%</span> saat checkout & kamu dapat <span className="text-green-400 font-black">komisi 10%</span> dari transaksinya.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-8 mb-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-sm font-black uppercase tracking-tight text-gray-300 mb-1">Kode Voucher Belum Tersedia</p>
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Hubungi admin untuk mendapatkan kode voucher kamu.</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Referrals', value: stats.totalReferrals, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'from-blue-600 to-blue-500', valueColor: 'text-white' },
            { label: 'Total Earned', value: formatRupiah(stats.totalEarned), icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-green-600 to-emerald-500', valueColor: 'text-green-400' },
            { label: 'Pending', value: formatRupiah(stats.pendingCommissions), icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-yellow-600 to-yellow-500', valueColor: 'text-yellow-400' },
            { label: 'Paid Out', value: formatRupiah(stats.paidCommissions), icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-green-600 to-green-500', valueColor: 'text-green-400' },
          ].map((s, i) => (
            <div key={i} className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-4 hover:border-white/[0.08] hover:-translate-y-0.5 transition-all relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${s.color} opacity-5 rounded-full blur-[20px] -mr-6 -mt-6`} />
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </div>
              <p className={`text-lg md:text-xl font-black ${s.valueColor}`}>{s.value}</p>
              <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-green-400">Withdraw Saldo</h2>
            </div>
            <div className="bg-zinc-900/60 border border-green-500/20 rounded-2xl px-5 py-2.5 flex items-center gap-3">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-black text-green-400">{formatRupiah(profile?.commission_balance || 0)}</span>
              <span className="text-[7px] text-gray-600 font-black uppercase tracking-widest">Balance</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-1.5 ml-1">Jumlah</label>
              <input type="number" min={settings?.min_withdraw || 50000} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm outline-none text-white focus:border-green-500/40 transition-all"
                placeholder={`Min ${formatRupiah(settings?.min_withdraw || 50000)}`} />
            </div>
            <div>
              <label className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-1.5 ml-1">E-Wallet</label>
              <div className="relative">
                <select value={withdrawMethod} onChange={e => setWithdrawMethod(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm outline-none text-white focus:border-green-500/40 transition-all appearance-none cursor-pointer">
                  <option value="dana">DANA</option>
                  <option value="gopay">GoPay</option>
                  <option value="ovo">OVO</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div>
              <label className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-1.5 ml-1">No. HP</label>
              <input type="text" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value)}
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm outline-none text-white focus:border-green-500/40 transition-all"
                placeholder="08xxxxxxxxxx" />
            </div>
            <div>
              <label className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-1.5 ml-1">Atas Nama</label>
              <input type="text" value={withdrawName} onChange={e => setWithdrawName(e.target.value)}
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm outline-none text-white focus:border-green-500/40 transition-all"
                placeholder="Nama lengkap" />
            </div>
            <div>
              <button onClick={handleWithdraw} disabled={submitting}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black py-3.5 rounded-xl text-[9px] uppercase tracking-widest hover:shadow-lg hover:shadow-green-600/30 transition-all disabled:opacity-50 hover:-translate-y-0.5 active:scale-95">
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses
                  </span>
                ) : 'Withdraw'}
              </button>
            </div>
          </div>

          {withdrawals.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/[0.05]">
              <h3 className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Riwayat Withdraw
              </h3>
              <div className="space-y-2">
                {withdrawals.map(w => (
                  <div key={w.id} className="flex items-center justify-between bg-zinc-900/30 rounded-xl px-4 py-3 hover:bg-zinc-900/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        w.status === 'approved' ? 'bg-green-500/15' :
                        w.status === 'rejected' ? 'bg-red-500/15' : 'bg-yellow-500/15'
                      }`}>
                        <span className={`text-sm ${
                          w.status === 'approved' ? 'text-green-400' :
                          w.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {w.status === 'approved' ? '✓' : w.status === 'rejected' ? '✗' : '⋯'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{formatRupiah(w.amount)}</p>
                        <p className="text-[8px] text-gray-500 flex items-center gap-1">
                          <span className="uppercase">{w.method}</span>
                          <span className="text-gray-700">|</span>
                          <span>{w.account_details}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                      w.status === 'approved' ? 'text-green-400 bg-green-500/10' :
                      w.status === 'rejected' ? 'text-red-400 bg-red-500/10' :
                      'text-yellow-400 bg-yellow-500/10'
                    }`}>
                      {w.status === 'approved' ? 'Dibayar' : w.status === 'rejected' ? 'Ditolak' : 'Pending'}
                    </span>
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
        <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 mt-6">
          <div className="flex items-center gap-2 mb-6 border-b border-white/[0.04] pb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h2 className="text-[14px] font-black uppercase tracking-widest text-white">Top Affiliates</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.04] text-[9px] text-gray-500 font-black uppercase tracking-widest">
                  <th className="pb-3 px-2 w-12 text-center">Rank</th>
                  <th className="pb-3 px-2">Affiliate</th>
                  <th className="pb-3 px-2 text-right">Total Earned</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-[10px] font-black uppercase text-gray-600">Belum ada data</td>
                  </tr>
                ) : (
                  leaderboard.map((u, i) => (
                    <tr key={u.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 px-2 text-center">
                        <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[10px] font-black ${
                          i === 0 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 
                          i === 1 ? 'bg-gray-300 text-black shadow-[0_0_15px_rgba(209,213,219,0.3)]' :
                          i === 2 ? 'bg-amber-700 text-white shadow-[0_0_15px_rgba(180,83,9,0.3)]' : 'bg-white/5 text-gray-400'
                        }`}>
                          {i + 1}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <p className={`text-[12px] font-bold truncate ${u.id === user.id ? 'text-purple-400' : 'text-white'}`}>
                          {u.full_name || u.email?.split('@')[0]}
                          {u.id === user.id && <span className="ml-2 text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded uppercase">You</span>}
                        </p>
                        {u.affiliate_tiers && (
                          <p className={`text-[9px] font-black uppercase mt-0.5 ${u.affiliate_tiers.color || 'text-gray-500'}`}>
                            {u.affiliate_tiers.name}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-2 text-right text-[12px] font-black text-green-400">
                        {formatRupiah(u.total_earned)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}
