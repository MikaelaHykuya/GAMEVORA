import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatRupiah } from '../lib/utils'
import { useToast } from '../contexts/ToastContext'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

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
  const [withdrawMethod, setWithdrawMethod] = useState('bank')
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
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${affiliateCode}`)
    showToast('Link affiliate disalin!', 'success')
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
      <span className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>Affiliate | GVR</title><meta name="description" content="Program affiliate GVR - dapatkan komisi dari referral." /></Helmet>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-[250px] h-[250px] bg-blue-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <Navbar />
      <BottomNav />

      <main className="pt-28 px-4 md:px-6 max-w-4xl mx-auto pb-32 relative">
        <div className="mb-10">
          <Link to="/profile" className="text-[10px] text-purple-400 hover:text-white transition font-bold tracking-wider">← Kembali ke Profile</Link>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent mt-4">Affiliate</h1>
          <p className="text-gray-500 text-sm mt-1">Dapatkan komisi dengan merekomendasikan GVR ke teman!</p>
        </div>

        {affiliateCode ? (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 mb-6">
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2">Link Affiliate Kamu</label>
            <div className="flex gap-2">
              <input type="text" readOnly value={`${window.location.origin}/register?ref=${affiliateCode}`}
                className="flex-1 bg-zinc-900/60 border border-purple-500/30 rounded-2xl px-5 py-3.5 text-sm outline-none text-white font-mono" />
              <button onClick={copyCode}
                className="bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black px-6 rounded-2xl text-[9px] uppercase tracking-widest hover:shadow-lg hover:shadow-purple-600/20 transition-all shrink-0">
                Salin
              </button>
            </div>
            <p className="text-[9px] text-gray-600 mt-3 tracking-wider">
              Atau bagikan kode: <span className="text-purple-400 font-bold font-mono">{affiliateCode}</span> &mdash; 10% komisi & referral dapat diskon 10%!
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 mb-6 text-center">
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2">Kode Affiliate Belum Tersedia</p>
            <p className="text-[9px] text-gray-600">Hubungi admin untuk mendapatkan kode affiliate kamu.</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Referral', value: stats.totalReferrals, icon: '👥' },
            { label: 'Total Pendapatan', value: formatRupiah(stats.totalEarned), icon: '💰' },
            { label: 'Pending', value: formatRupiah(stats.pendingCommissions), icon: '⏳' },
            { label: 'Dibayar', value: formatRupiah(stats.paidCommissions), icon: '✅' },
          ].map((s, i) => (
            <div key={i} className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-4 text-center">
              <span className="text-2xl block mb-2">{s.icon}</span>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">{s.label}</p>
              <p className="text-lg font-black text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-purple-400">Withdraw Saldo</h2>
            <p className="text-sm font-black text-green-400">Saldo: {formatRupiah(profile?.commission_balance || 0)}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2">Jumlah</label>
              <input type="number" min="50000" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm outline-none text-white focus:border-purple-500/40 transition-all"
                placeholder="Min Rp50.000" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2">E-Wallet</label>
              <select value={withdrawMethod} onChange={e => setWithdrawMethod(e.target.value)}
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm outline-none text-white focus:border-purple-500/40 transition-all appearance-none cursor-pointer">
                <option value="dana">DANA</option>
                <option value="gopay">GoPay</option>
                <option value="ovo">OVO</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2">No. HP</label>
              <input type="text" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value)}
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm outline-none text-white focus:border-purple-500/40 transition-all"
                placeholder="08xxxxxxxxxx" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2">Atas Nama</label>
              <input type="text" value={withdrawName} onChange={e => setWithdrawName(e.target.value)}
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm outline-none text-white focus:border-purple-500/40 transition-all"
                placeholder="Nama lengkap" />
            </div>
            <div>
              <button onClick={handleWithdraw} disabled={submitting}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black py-3 rounded-xl text-[9px] uppercase tracking-widest hover:shadow-lg hover:shadow-green-600/20 transition-all disabled:opacity-50">
                {submitting ? 'Memproses...' : 'Withdraw'}
              </button>
            </div>
          </div>

          {withdrawals.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/[0.05]">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Riwayat Withdraw</h3>
              <div className="space-y-2">
                {withdrawals.map(w => (
                  <div key={w.id} className="flex items-center justify-between bg-zinc-900/30 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-white">{formatRupiah(w.amount)}</p>
                      <p className="text-[9px] text-gray-500">
                        {w.method === 'dana' ? 'DANA' : w.method === 'gopay' ? 'GoPay' : 'OVO'} &middot; {w.account_details}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-lg ${
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
            <h2 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-4">Referral Saya</h2>
            {referrals.length === 0 ? (
              <p className="text-[9px] text-gray-600 text-center py-8 uppercase tracking-wider">Belum ada referral</p>
            ) : (
              <div className="space-y-3">
                {referrals.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-zinc-900/30 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-white">{r.profiles?.full_name || 'Pengguna'}</p>
                      <p className="text-[9px] text-gray-500 font-mono">{r.profiles?.email}</p>
                    </div>
                    <p className="text-[9px] text-gray-500">{new Date(r.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-4">Riwayat Komisi</h2>
            {commissions.length === 0 ? (
              <p className="text-[9px] text-gray-600 text-center py-8 uppercase tracking-wider">Belum ada komisi</p>
            ) : (
              <div className="space-y-3">
                {commissions.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-zinc-900/30 rounded-xl px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{c.game_title || 'Pembelian'}</p>
                      <p className="text-[9px] text-gray-500">
                        {c.status === 'pending' ? '⏳ Pending' : '✅ Dibayar'} &middot; {new Date(c.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <p className="text-sm font-black text-green-400 ml-3">{formatRupiah(c.commission_amount)}</p>
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
