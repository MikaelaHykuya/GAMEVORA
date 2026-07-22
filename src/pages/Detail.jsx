import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatRupiah } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useToast } from '../contexts/ToastContext'
import TypingText from '../components/TypingText'
import Reviews from '../components/Reviews'
import Navbar from '../components/Navbar'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { FaShoppingCart, FaUnlock, FaHeart, FaRegHeart, FaStar, FaDesktop, FaMicrochip, FaMemory, FaGamepad, FaDownload, FaRocket, FaCheckCircle, FaTimes, FaCog, FaBook, FaBoxOpen } from 'react-icons/fa'

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart, fetchCartCount, handleDirectBuy } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { showToast } = useToast()

  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [avgRating, setAvgRating] = useState('0.0')
  const [isInstalling, setIsInstalling] = useState(false)
  const [installStep, setInstallStep] = useState(0)
  const [showEngineWarning, setShowEngineWarning] = useState(false)

  useEffect(() => {
    if (!id) { navigate('/'); return }
    loadGame()
  }, [id])

  async function loadGame() {
    try {
      const { data, error } = await supabase.from('games').select('*').eq('id', id).single()
      if (error) throw error
      setGame(data)

      if (user) {
        const { data: entry } = await supabase.from('library').select('status').eq('user_id', user.id).eq('game_id', id).maybeSingle()
        if (entry) setStatus(entry.status)
      }
      loadReviews()
      fetchCartCount()
    } catch {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  async function loadReviews() {
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, profiles:user_id(full_name, avatar_url)')
      .eq('game_id', id)
      .order('created_at', { ascending: false })
    if (data && data.length > 0) {
      setAvgRating((data.reduce((acc, r) => acc + r.rating, 0) / data.length).toFixed(1))
    }
  }

  const handleBuy = async () => {
    if (!user) { navigate('/login'); return }
    handleDirectBuy(game)
  }

  // handleCheckout is handled globally

  const handleAutoInstall = () => {
    if (!localStorage.getItem('gvr_engine_installed')) {
      setShowEngineWarning(true)
      return
    }

    setIsInstalling(true)
    setInstallStep(0)
    const scriptUrl = new URL('voratools.ps1', `${window.location.origin}${import.meta.env.BASE_URL}`).href
    
    const sB64 = encodeURIComponent(btoa(scriptUrl))
    const lB64 = encodeURIComponent(btoa(game.voratools_link))
    const nB64 = encodeURIComponent(btoa(encodeURIComponent(game.title || 'Game')))
    const a = game.steam_appid || '0'
    
    const gvrUrl = `gvr://install/?s=${sB64}&l=${lB64}&a=${a}&n=${nB64}`
    
    const failTimeout = setTimeout(() => {
      if (document.hasFocus()) {
        setIsInstalling(false)
        localStorage.removeItem('gvr_engine_installed')
        setShowEngineWarning(true)
      }
    }, 2500)

    window.addEventListener('blur', () => clearTimeout(failTimeout), { once: true })
    window.location.href = gvrUrl

    const step1 = setTimeout(() => setInstallStep(1), 3000)
    const step2 = setTimeout(() => setInstallStep(2), 7000)
    const step3 = setTimeout(() => setInstallStep(3), 14000)

    window.addEventListener('focus', () => {
      if (!localStorage.getItem('gvr_engine_installed')) {
        clearTimeout(step1); clearTimeout(step2); clearTimeout(step3);
      }
    }, { once: true })
  }

  const proceedToInstall = () => {
    localStorage.setItem('gvr_engine_installed', 'true')
    setShowEngineWarning(false)
    handleAutoInstall()
  }

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const itemVariants = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }
  const slideInLeft = { hidden: { opacity: 0, x: -50 }, show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } } }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 animate-pulse">Syncing Intel...</p>
        </div>
      </div>
    )
  }

  if (!game) return null

  const basePrice = game.discount_price > 0 ? game.discount_price : game.price
  const hasDiscount = game.discount_price > 0
  const discountPercent = hasDiscount ? Math.round((1 - game.discount_price / game.price) * 100) : 0
  const specIcons = { os: <FaDesktop />, cpu: <FaMicrochip />, ram: <FaMemory />, gpu: <FaGamepad /> }
  const linkIcons = { box: <FaBoxOpen />, tool: <FaCog />, guide: <FaBook /> }

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans overflow-x-hidden relative">
      <Helmet><title>{game.title} | GAMEVORA</title><meta name="description" content={`Detail and purchase options for ${game.title}`} /></Helmet>
      
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
      </div>

      <Navbar />
      
      <main className="max-w-7xl mx-auto pt-28 pb-20 px-4 md:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-gray-500">
          <Link to="/" className="hover:text-purple-400 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/#store" className="hover:text-purple-400 transition-colors">Store</Link>
          <span>/</span>
          <span className="text-purple-400">{game.title}</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <motion.div variants={slideInLeft} initial="hidden" animate="show" className="lg:col-span-5 space-y-8">
            <div className="relative group rounded-[2.5rem] p-1">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/30 to-blue-500/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[3/4] border border-white/[0.05]">
                <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030303]/90 via-transparent to-[#030303]/40" />
                <div className="absolute bottom-6 inset-x-6 flex justify-between items-end">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 backdrop-blur-md rounded-2xl border border-purple-500/30 text-purple-200 text-[10px] font-black uppercase tracking-widest shadow-lg">
                    {game.genre || 'Game'}
                  </div>
                  {hasDiscount && (
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-fuchsia-600 rounded-full text-white text-[11px] font-black tracking-tighter shadow-[0_0_20px_rgba(192,38,211,0.5)] animate-pulse">
                      -{discountPercent}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 backdrop-blur-md shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 mb-6 flex items-center gap-3">
                <FaDesktop className="text-lg" /> System Requirements
              </h3>
              <div className="space-y-4">
                {[['Minimal', 'minimum', 'gray'], ['Recommended', 'recommended', 'fuchsia']].map(([label, key, color]) => (
                  <div key={key} className={`p-5 bg-white/[0.02] border ${color === 'fuchsia' ? 'border-fuchsia-500/30' : 'border-white/5'} rounded-2xl`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${color === 'fuchsia' ? 'text-fuchsia-400' : 'text-gray-500'} mb-3 block`}>{label}</span>
                    <ul className="space-y-3">
                      {['os', 'cpu', 'ram', 'gpu'].map(s => (
                        <li key={s} className="flex items-center gap-3 text-xs">
                          <span className="w-6 flex justify-center text-gray-600">{specIcons[s]}</span>
                          <span className="text-gray-300 font-medium truncate flex-1">{game.specifications?.[key]?.[s] || '-'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" animate="show" className="lg:col-span-7 space-y-10">
            <motion.div variants={itemVariants} className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[0.9] text-white">
                {game.title}
              </h1>
              <div className="flex flex-wrap items-end gap-6 pt-4 pb-2">
                <p className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                  {basePrice === 0 ? 'FREE' : formatRupiah(basePrice)}
                </p>
                <button onClick={() => toggleWishlist(game.id)}
                  className={`ml-auto p-4 rounded-2xl border transition-all ${
                    isInWishlist(game.id)
                      ? 'bg-fuchsia-600/20 border-fuchsia-500/30 text-fuchsia-400 shadow-[0_0_20px_rgba(192,38,211,0.2)]'
                      : 'bg-white/[0.02] border-white/10 text-gray-400 hover:text-fuchsia-400 hover:border-fuchsia-500/30 hover:bg-white/[0.05]'
                  }`}>
                  {isInWishlist(game.id) ? <FaHeart size={20} /> : <FaRegHeart size={20} />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-lg relative overflow-hidden">
              <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <FaBook /> Deskripsi Game
              </h3>
              <div className="text-sm md:text-base text-gray-300 leading-relaxed font-medium">
                <TypingText text={game.description} speed={25} delay={300} />
              </div>
            </motion.div>

            {status === 'approved' ? (
              <motion.div variants={itemVariants} className="space-y-8">
                <div className="w-full bg-green-500/10 text-green-400 p-6 rounded-2xl text-center border border-green-500/20 font-black uppercase text-xs flex items-center justify-center gap-3">
                  <FaCheckCircle size={20} /> Akses Game Telah Dibuka
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 flex items-center gap-2">
                    <FaDownload /> Unduhan & Akses
                  </h3>
                  <div className="grid gap-3">
                    {game.download_links?.map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 bg-white/[0.03] border border-white/[0.05] rounded-2xl hover:border-purple-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">{linkIcons[link.icon] || <FaBoxOpen />}</div>
                          <div className="flex flex-col"><span className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Tautan Resmi</span><span className="text-sm font-bold text-gray-200">{link.label}</span></div>
                        </div>
                        <span className="text-xs font-black text-purple-400 bg-purple-500/10 px-4 py-2 rounded-xl">UNDUH</span>
                      </a>
                    ))}
                    {game.voratools_link && (
                      <button onClick={handleAutoInstall} className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl group">
                        <div className="flex items-center gap-4"><div className="w-12 h-12 bg-purple-500 to-indigo-500 rounded-xl flex items-center justify-center text-white"><FaRocket /></div><div className="flex flex-col text-left"><span className="text-[8px] font-black uppercase text-purple-300">VoraTools</span><span className="text-sm font-bold text-white">1-Click Auto Install</span></div></div>
                        <span className="text-xs font-black text-purple-300 bg-white/10 px-4 py-2 rounded-xl">MULAI</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : status === 'pending' ? (
              <motion.div variants={itemVariants} className="w-full bg-yellow-500/10 text-yellow-400 p-6 rounded-2xl text-center border border-yellow-500/20 font-black uppercase text-xs flex items-center justify-center gap-3">
                Menunggu Verifikasi Admin
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => addToCart(game.id)} className="flex-1 bg-white/[0.03] border border-white/10 py-5 rounded-2xl font-black text-xs uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-3"><FaShoppingCart /> Add to Cart</button>
                <button onClick={() => handleBuy()} className="flex-[2] bg-gradient-to-r from-purple-600 to-indigo-600 py-5 rounded-2xl font-black text-xs uppercase hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] transition-all flex items-center justify-center gap-3"><FaUnlock /> Beli & Buka Akses</button>
              </motion.div>
            )}

            <motion.section variants={itemVariants} className="pt-12">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black uppercase text-white">Ulasan</h3>
                <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
                  <FaStar className="text-yellow-400" />
                  <span className="text-lg font-black text-yellow-400">{avgRating}</span>
                </div>
              </div>
              <Reviews gameId={id} />
            </motion.section>
          </motion.div>
        </div>
      </main>

      {/* Modals are handled globally */}

      <AnimatePresence>
        {isInstalling && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-lg text-center flex flex-col items-center bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
              {installStep < 3 ? (
                <>
                  <div className="w-24 h-24 mb-8 border-[4px] border-t-purple-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
                  <h2 className="text-2xl font-black uppercase text-white">System Integration</h2>
                  <p className="text-xs text-purple-400 mt-2 animate-pulse">{installStep === 0 ? 'Menginisialisasi...' : 'Sinkronisasi...'}</p>
                </>
              ) : (
                <div className="text-green-400 text-4xl mb-6"><FaCheckCircle /></div>
              )}
              <button onClick={() => setIsInstalling(false)} className="mt-8 px-10 py-4 bg-white/5 rounded-xl font-black text-[10px] uppercase text-white w-full">Tutup</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEngineWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 text-center shadow-2xl">
              <h2 className="text-xl font-black uppercase mb-3">GVR Engine Dibutuhkan</h2>
              <p className="text-xs text-gray-400 mb-8">Install GVR Engine untuk akses 1-Click Install.</p>
              <div className="space-y-3">
                <a href="/GVREngine_Setup.bat" download onClick={() => localStorage.setItem('gvr_engine_installed', 'true')} className="block w-full py-4 bg-purple-600 rounded-xl text-xs font-bold uppercase">Unduh Engine</a>
                <button onClick={proceedToInstall} className="w-full py-4 bg-white/5 rounded-xl text-xs font-bold uppercase">Saya Sudah Pasang</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
