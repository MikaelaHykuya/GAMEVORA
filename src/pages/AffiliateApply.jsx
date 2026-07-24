import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Navbar from '../components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'
import { FaStore, FaTag, FaRocket, FaCheckCircle, FaExclamationCircle, FaStar, FaMoneyBillWave, FaChartLine } from 'react-icons/fa'

export default function AffiliateApply() {
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  
  const [applyStoreName, setApplyStoreName] = useState('')
  const [applyVoucherCode, setApplyVoucherCode] = useState('')
  const [applying, setApplying] = useState(false)
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (profile?.affiliate_code) { navigate('/affiliate'); return }
    fetchApplication()
  }, [user, profile])

  async function fetchApplication() {
    setLoading(true)
    const { data } = await supabase.from('affiliate_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (data) setApplication(data)
    setLoading(false)
  }

  const handleApplyAffiliate = async (e) => {
    e.preventDefault()
    if (!applyStoreName.trim()) return showToast('Isi nama akun jualan atau sosial media Anda', 'warning')
    if (!applyVoucherCode.trim()) return showToast('Isi kode voucher yang diinginkan', 'warning')
    setApplying(true)
    const { data, error } = await supabase.from('affiliate_applications').insert({
      user_id: user.id,
      store_name: applyStoreName.trim(),
      requested_code: applyVoucherCode.trim().toUpperCase()
    }).select().single()
    
    if (error) {
      showToast('Gagal mengajukan: ' + error.message, 'error')
    } else {
      showToast('Pengajuan berhasil dikirim!', 'success')
      setApplication(data)
      
      const sender = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
      supabase.functions.invoke('send-push', { 
        body: { 
          title: `Pengajuan Affiliate Baru 📝`, 
          message: `${sender} mendaftar program affiliate.`, 
          is_admin: true 
        } 
      }).catch(console.error)
    }
    setApplying(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
      </div>
    </div>
  )

  const FloatingParticle = ({ size, color, delay, top, left, duration }) => (
    <motion.div
      initial={{ y: 0, opacity: 0.3 }}
      animate={{ y: [0, -100, 0], opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: duration, repeat: Infinity, ease: 'easeInOut', delay }}
      className={`absolute rounded-full blur-xl ${color}`}
      style={{ width: size, height: size, top, left }}
    />
  )

  return (
    <div className="min-h-screen bg-[#030303] text-white relative overflow-hidden font-sans">
      <Helmet><title>Daftar Partner | GAMEVORA</title></Helmet>
      
      {/* Immersive Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#13072E] via-[#030303] to-[#030303]">
        <FloatingParticle size={300} color="bg-indigo-600/20" delay={0} top="-10%" left="20%" duration={12} />
        <FloatingParticle size={400} color="bg-fuchsia-600/20" delay={2} top="40%" left="-10%" duration={15} />
        <FloatingParticle size={250} color="bg-blue-600/20" delay={1} top="60%" left="80%" duration={10} />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.04] mix-blend-overlay" />
      </div>

      <Navbar />
      
      <main className="pt-28 px-4 md:px-8 max-w-7xl mx-auto pb-20 relative z-10 min-h-screen flex flex-col justify-center">
        
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <Link to="/affiliate" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group">
            <span className="transform group-hover:-translate-x-1 transition-transform">&larr;</span> Kembali
          </Link>
        </motion.div>

        {application?.status === 'pending' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl mx-auto bg-white/[0.02] border border-indigo-500/30 rounded-[2rem] p-12 text-center backdrop-blur-2xl relative overflow-hidden shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent" />
            <div className="relative z-10">
              <motion.div 
                animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/20"
              >
                <FaCheckCircle className="w-12 h-12 text-indigo-400" />
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">Pengajuan Sedang Diproses</h1>
              <p className="text-base text-gray-400 leading-relaxed max-w-md mx-auto">
                Admin GAMEVORA sedang meninjau pengajuan partner Anda. Proses ini biasanya memakan waktu 1x24 jam.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            
            {/* Left Column - Selling Proposition */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}
              className="space-y-8 lg:pr-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                <FaStar className="text-indigo-400" /> GAMEVORA Partner Program
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tighter">
                Ubah Pengaruhmu <br /> Menjadi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 animate-gradient">Pendapatan.</span>
              </h1>
              
              <p className="text-lg text-gray-400 leading-relaxed max-w-xl">
                Jadilah bagian dari revolusi gaming. Bagikan kodemu, tawarkan diskon eksklusif ke komunitasmu, dan nikmati komisi langsung tanpa batas maksimal.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="bg-white/[0.03] border border-white/[0.05] p-5 rounded-2xl flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400"><FaMoneyBillWave size={20}/></div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Komisi Tinggi</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">Mulai dari 10% per transaksi dan terus meningkat.</p>
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] p-5 rounded-2xl flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-fuchsia-500/10 text-fuchsia-400"><FaChartLine size={20}/></div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Dashboard Realtime</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">Pantau klik, penjualan, dan penarikan dana secara transparan.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Form */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            >
              <div className="bg-white/[0.02] border border-white/[0.08] p-8 md:p-10 rounded-[2.5rem] backdrop-blur-3xl relative shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]">
                {/* Neon Glow Behind Form */}
                <div className="absolute -inset-[1px] rounded-[2.5rem] bg-gradient-to-b from-indigo-500/20 via-transparent to-transparent -z-10" />
                
                <h2 className="text-2xl font-bold text-white mb-2">Mulai Perjalananmu</h2>
                <p className="text-sm text-gray-400 mb-8">Lengkapi form di bawah ini untuk mendapatkan persetujuan.</p>

                {application?.status === 'rejected' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-2xl mb-8 flex items-start gap-3">
                    <FaExclamationCircle className="mt-1 flex-shrink-0" />
                    <div>
                      <strong className="block mb-1">Pengajuan ditolak</strong>
                      Coba ajukan ulang dengan informasi yang lebih lengkap.
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleApplyAffiliate} className="space-y-6">
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 group-focus-within:text-indigo-400 transition-colors flex items-center gap-2">
                      <FaStore /> Nama Toko / Sosial Media
                    </label>
                    <input type="text" value={applyStoreName} onChange={e => setApplyStoreName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all shadow-inner placeholder:text-gray-600"
                      placeholder="Misal: @gamingstore.id / YouTube Gaming" required />
                  </div>
                  
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 group-focus-within:text-fuchsia-400 transition-colors flex items-center gap-2">
                      <FaTag /> Kode Unik Pilihan
                    </label>
                    <input type="text" value={applyVoucherCode} onChange={e => setApplyVoucherCode(e.target.value.toUpperCase())}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 outline-none text-white font-mono text-lg focus:border-fuchsia-500/50 focus:bg-fuchsia-500/5 transition-all shadow-inner placeholder:text-gray-600 uppercase"
                      placeholder="PROMO2024" maxLength={15} required />
                    <p className="text-[10px] text-gray-500 ml-1">Ini akan menjadi kode yang kamu bagikan ke audiensmu.</p>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    type="submit" disabled={applying}
                    className="w-full mt-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white font-bold py-5 rounded-2xl text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_-5px_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_-5px_rgba(139,92,246,0.7)] transition-all disabled:opacity-50 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {applying ? 'Memproses...' : <><FaRocket /> Ajukan Sekarang</>}
                    </span>
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </main>
      
      <style>{`
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}
