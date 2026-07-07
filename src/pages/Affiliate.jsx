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

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    init()
  }, [user])

  async function init() {
    setLoading(true)
    const code = await ensureAffiliateCode()
    setAffiliateCode(profile?.affiliate_code || code || '')

    const [referralsRes, commissionsRes, withdrawalsRes] = await Promise.all([
      supabase.from('affiliate_referrals').select('id, created_at, referred_id, profiles!inner(full_name, email)').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('affiliate_commissions').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('affiliate_withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

    setReferrals(referralsRes.data || [])
    setCommissions(commissionsRes.data || [])
    setWithdrawals(withdrawalsRes.data || [])

    const totalEarned = (commissionsRes.data || []).reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0)
    const pendingCommissions = (commissionsRes.data || []).filter(c => c.status === 'pending').reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0)
    const paidCommissions = (commissionsRes.data || []).filter(c => c.status === 'paid').reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0)

    setStats({
      totalReferrals: (referralsRes.data || []).length,
      totalEarned,
      pendingCommissions,
      paidCommissions,
    })
    setLoading(false)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(affiliateCode)
    showToast('Kode voucher disalin!', 'success')
  }

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount)
    if (!amount || amount < 50000) return showToast('Minimal withdraw Rp50.000', 'warning')
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

        <div className="relative mb-10">
          <div className="absolute inset-0 bg-gradient-to-b from-green-600/20 via-transparent to-transparent rounded-[32px]" />
          <div className="relative bg-zinc-900/60 border border-white/[0.04] rounded-[32px] overflow-hidden backdrop-blur-xl">
            <div className="h-28 md:h-32 bg-gradient-to-r from-green-900/40 via-emerald-900/20 to-green-900/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_70%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(34,197,94,0.1),transparent_70%)]" />
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-zinc-900 to-transparent" />
              <div className="absolute top-4 right-6 flex items-center gap-1.5">
                <span className="text-[7px] font-black uppercase tracking-widest text-green-400/60">
                  {stats.totalReferrals > 0 ? `${stats.totalReferrals} referrals` : 'voucher program'}
                </span>
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
            <div className="px-6 md:px-8 pb-6 -mt-12 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex items-end gap-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="pb-1">
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Kode Voucher</h1>
                    <p className="text-[10px] text-gray-400 font-bold tracking-wider mt-1">Bagikan & dapatkan komisi 10% setiap transaksi!</p>
                  </div>
                </div>
                <Link to="/profile"
                  className="text-[9px] text-gray-500 hover:text-green-400 font-black uppercase tracking-widest transition-colors flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7 7l-7-7 7-7" />
                  </svg>
                  Profile
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
              <input type="number" min="50000" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm outline-none text-white focus:border-green-500/40 transition-all"
                placeholder="Min Rp50.000" />
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

      </main>
    </div>
  )
}
