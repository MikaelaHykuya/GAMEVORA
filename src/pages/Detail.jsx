import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatRupiah, getAvatarUrl } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useToast } from '../contexts/ToastContext'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import CartModal from '../components/CartModal'
import PaymentModal from '../components/PaymentModal'
import { Helmet } from 'react-helmet-async'

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart, fetchCartCount } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { showToast } = useToast()

  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState('0.0')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentSubtotal, setPaymentSubtotal] = useState(0)
  const [paymentUniqueCode, setPaymentUniqueCode] = useState(0)
  const [cartOpen, setCartOpen] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [installStep, setInstallStep] = useState(0)
  const [showEngineWarning, setShowEngineWarning] = useState(false)

  useEffect(() => {
    if (!id) { navigate('/'); return }
    loadGame()
  }, [id])

  async function loadGame() {
    try {
      const [gameRes] = await Promise.all([
        supabase.from('games').select('*').eq('id', id).single(),
      ])
      if (gameRes.error) throw new Error('Game not found')
      setGame(gameRes.data)

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
    if (data) {
      setReviews(data)
      if (data.length > 0) {
        setAvgRating((data.reduce((acc, r) => acc + r.rating, 0) / data.length).toFixed(1))
      }
    }
  }

  const submitReview = async () => {
    if (selectedRating === 0) return showToast('Pilih bintang terlebih dahulu!', 'warning')
    if (!user) return showToast('Silakan login untuk mengirim ulasan.', 'info')
    setSubmittingReview(true)
    const { error } = await supabase.from('reviews').insert([{
      game_id: id, user_id: user.id, rating: selectedRating, comment,
    }])
    if (error) {
      if (error.code === '23505') showToast('Anda sudah mereview game ini.', 'info')
      else showToast(error.message, 'error')
    } else {
      setComment('')
      setSelectedRating(0)
      loadReviews()
    }
    setSubmittingReview(false)
  }



  const handleBuy = async () => {
    if (!user) { navigate('/login'); return }
    const basePrice = game.discount_price > 0 ? game.discount_price : game.price
    const uniqueCode = 500
    const finalAmount = (Math.floor(basePrice / 1000) * 1000) + uniqueCode
    const { error } = await supabase.from('cart').upsert(
      { user_id: user.id, game_id: game.id },
      { onConflict: 'user_id, game_id', ignoreDuplicates: true }
    )
    if (error) return showToast('Gagal menambahkan ke keranjang: ' + error.message, 'error')
    fetchCartCount()
    setPaymentSubtotal(basePrice)
    setPaymentUniqueCode(uniqueCode)
    setPaymentAmount(finalAmount)
    setPaymentOpen(true)
  }

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return }
    const { data: items } = await supabase.from('cart').select('games(price, discount_price)').eq('user_id', user.id)
    if (!items?.length) return showToast('Cart is empty!', 'warning')
    const subtotal = items.reduce((sum, i) => sum + (i.games.discount_price || i.games.price), 0)
    const uniqueCode = 500
    setPaymentSubtotal(subtotal)
    setPaymentUniqueCode(uniqueCode)
    setPaymentAmount((Math.floor(subtotal / 1000) * 1000) + uniqueCode)
    setCartOpen(false)
    setPaymentOpen(true)
  }

  const handleAutoInstall = () => {
    if (!localStorage.getItem('gvr_engine_installed')) {
      setShowEngineWarning(true)
      return
    }

    setIsInstalling(true)
    setInstallStep(0)
    const scriptUrl = `${window.location.origin}/voratools.ps1`
    
    // Proper URI-safe base64 for all params
    const sB64 = encodeURIComponent(btoa(scriptUrl))
    const lB64 = encodeURIComponent(btoa(game.voratools_link))
    const nB64 = encodeURIComponent(btoa(encodeURIComponent(game.title || 'Game')))
    const a = game.steam_appid || '0'
    
    const gvrUrl = `gvr://install/?s=${sB64}&l=${lB64}&n=${nB64}&a=${a}`
    
    // Industry standard hack to detect if Custom Protocol failed (user lied)
    // When custom protocol launches, browser loses focus.
    const failTimeout = setTimeout(() => {
      if (document.hasFocus()) {
        setIsInstalling(false)
        localStorage.removeItem('gvr_engine_installed')
        setShowEngineWarning(true)
      }
    }, 2500)

    window.addEventListener('blur', () => {
      clearTimeout(failTimeout)
    }, { once: true })

    // Trigger the custom protocol
    window.location.href = gvrUrl

    const step1 = setTimeout(() => setInstallStep(1), 3000)
    const step2 = setTimeout(() => setInstallStep(2), 7000)
    const step3 = setTimeout(() => setInstallStep(3), 14000)

    // Cleanup timeouts if component unmounts or failed
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto">
            <div className="absolute inset-0 border-[3px] border-purple-500/20 rounded-full animate-ping" />
            <div className="absolute inset-1 border-[3px] border-transparent border-t-purple-500 rounded-full animate-spin" />
            <div className="absolute inset-4 border-[2px] border-transparent border-b-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-30 animate-pulse">Syncing Intelligence...</p>
        </div>
      </div>
    )
  }

  if (!game) return null

  const basePrice = game.discount_price > 0 ? game.discount_price : game.price
  const icons = { box: '📦', tool: '🔧', guide: '📖', fix: '🛠️' }
  const hasDiscount = game.discount_price > 0
  const discountPercent = hasDiscount ? Math.round((1 - game.discount_price / game.price) * 100) : 0

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>GVR - Detail Game</title><meta name="description" content="Game details and purchase options" /></Helmet>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-blue-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-600/3 rounded-full blur-[120px]" />
      </div>

      <Navbar />
      <BottomNav />

      <main className="max-w-7xl mx-auto pt-28 pb-48 px-6 relative">
        <div className="flex items-center gap-3 mb-8 text-[8px] font-black uppercase tracking-widest text-gray-600 animate-fade-in">
          <Link to="/" className="hover:text-purple-400 transition-colors">Home</Link>
          <span className="text-gray-800">/</span>
          <Link to="/#store" className="hover:text-purple-400 transition-colors">Vault</Link>
          <span className="text-gray-800">/</span>
          <span className="text-purple-400">{game.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20">
          <div className="lg:col-span-5 space-y-8">
            <div className="rounded-3xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] border border-white/[0.06] aspect-[4/5] relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 pointer-events-none" />
              <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
              <div className="absolute bottom-8 left-8 flex items-center gap-3">
                <span className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-600/30">
                  {game.genre || 'License'}
                </span>
                {hasDiscount && (
                  <span className="px-4 py-2.5 bg-red-600/90 backdrop-blur-xl rounded-2xl text-[10px] font-black tracking-widest shadow-xl animate-pulse">
                    -{discountPercent}%
                  </span>
                )}
              </div>
              <div className="absolute top-6 left-6 flex items-center gap-2">
                {game.connectivity_type === 'Online' ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/70 backdrop-blur-xl rounded-lg text-[8px] font-black uppercase tracking-wider border border-blue-400/20">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/70 backdrop-blur-xl rounded-lg text-[8px] font-black uppercase tracking-wider border border-green-400/20">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Offline
                  </span>
                )}
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" />
                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400">System Requirements</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[['Minimal', 'minimum', 'gray'], ['Recommended', 'recommended', 'purple']].map(([label, key, color]) => (
                  <div key={key} className={`p-4 bg-${color === 'purple' ? 'purple-600/5 border-purple-500/10 hover:border-purple-500/20' : 'zinc-900/60 border-white/[0.06] hover:border-white/[0.10]'} border rounded-2xl transition-all`}>
                    <span className={`text-[8px] font-black uppercase tracking-widest text-${color === 'purple' ? 'purple-400' : 'gray-500'}`}>{label}</span>
                    <ul className="mt-3 space-y-2">
                      {['os', 'cpu', 'ram', 'gpu'].map(s => (
                        <li key={s} className="flex items-center gap-2 text-[10px]">
                          <span className="w-8 shrink-0 text-gray-600 uppercase font-black tracking-wider">{s}</span>
                          <span className="flex-1 text-gray-300 leading-tight truncate">{game.specifications?.[key]?.[s] || '-'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-5 animate-slide-up">
              <div className="flex items-center gap-2">
                {game.is_trending && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-red-600/15 text-red-400 rounded-full text-[7px] font-black uppercase tracking-wider border border-red-500/20">
                    <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                    Trending
                  </span>
                )}
                <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">{game.connectivity_type}</span>
              </div>
              <h1 className="font-black italic uppercase leading-[0.85] text-5xl sm:text-6xl md:text-7xl tracking-tighter break-words hyphens-auto">{game.title}</h1>
              <div className="flex flex-wrap items-end gap-5">
                <p className="text-5xl font-black italic tracking-tighter bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                  {basePrice === 0 ? 'FREE' : formatRupiah(basePrice)}
                </p>
                {hasDiscount && (
                  <>
                    <span className="text-xl text-gray-600 line-through font-bold">{formatRupiah(game.price)}</span>
                    <span className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-black rounded-xl shadow-lg shadow-red-600/20 animate-pulse">-{discountPercent}%</span>
                  </>
                )}
                <button onClick={() => toggleWishlist(game.id)}
                  className={`p-3 rounded-xl border transition-all active-scale ${
                    isInWishlist(game.id)
                      ? 'bg-pink-600/20 border-pink-500/30 text-pink-400'
                      : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:text-pink-400 hover:border-pink-500/30'
                  }`}>
                  <svg className="w-4 h-4" fill={isInWishlist(game.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-1 bg-purple-500 rounded-full" />
                <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Vault Description</h3>
              </div>
              <p className="text-gray-300 leading-relaxed text-base font-medium">{game.description}</p>
            </div>

            {status === 'approved' ? (
              <>
              <div className="w-full bg-green-600/10 text-green-400 p-5 rounded-2xl text-center border border-green-500/20 font-black uppercase text-[11px] animate-fade-in flex items-center justify-center gap-3 shadow-lg shadow-green-500/5">
                <div className="w-7 h-7 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                Game sudah masuk ke library
              </div>

                <div className="space-y-8 pt-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
                  <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-purple-500 rounded-full" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400">Authorized Links</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {game.download_links?.map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-5 bg-zinc-900/60 border border-white/[0.06] rounded-2xl hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-purple-500/5 hover:border-purple-500/30 transition-all duration-300 group active-scale">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="flex-shrink-0 w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-600/20 transition-all">
                            <span className="text-base">{icons[link.icon] || '📎'}</span>
                          </div>
                          <div className="flex flex-col text-left min-w-0 flex-1 pr-2">
                            <span className="text-[7px] font-black uppercase text-gray-600 tracking-widest truncate">Download Link</span>
                            <span className="text-xs font-bold uppercase mt-0.5 truncate">{link.label}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-purple-400 group-hover:text-white transition-colors">GET</span>
                          <div className="w-7 h-7 bg-white/[0.03] rounded-lg flex items-center justify-center group-hover:bg-purple-600/30 transition-all">
                            <svg className="w-3.5 h-3.5 text-purple-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </div>
                        </div>
                      </a>
                    ))}
                    {game.voratools_link && (
                      <div className="flex flex-col gap-2">
                        <button onClick={handleAutoInstall}
                          className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/30 rounded-2xl hover:from-purple-600/20 hover:to-blue-600/20 hover:border-purple-400/50 transition-all duration-300 group active-scale">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="flex-shrink-0 w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/30 group-hover:bg-purple-600/30 transition-all">
                              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <div className="flex flex-col text-left min-w-0 flex-1 pr-2">
                              <span className="text-[7px] font-black uppercase text-purple-400 tracking-widest truncate">VoraTools</span>
                              <span className="text-xs font-bold uppercase mt-0.5 text-white truncate">1-Click Install</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-purple-400 group-hover:text-white transition-colors">START</span>
                            <div className="w-7 h-7 bg-white/[0.03] rounded-lg flex items-center justify-center group-hover:bg-purple-600/40 transition-all">
                              <svg className="w-3.5 h-3.5 text-purple-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </button>
                        <a href="/GVREngine_Setup.bat" download
                          className="text-[9px] text-center text-gray-500 hover:text-purple-400 underline decoration-purple-500/30 underline-offset-4 transition-colors">
                          Belum pasang GVR Engine? Download Setup (1x Install)
                        </a>
                      </div>
                    )}
                  </div>

                  {game.manual_guide && (
                    <div className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-full blur-[40px] pointer-events-none" />
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.3em]">Installation Guide</span>
                      </div>
                      <div className="text-[13px] text-gray-400 leading-relaxed whitespace-pre-line font-medium pl-4 border-l border-yellow-500/10 break-words">
                        {game.manual_guide}
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </>
            ) : status === 'pending' ? (
              <div className="w-full bg-yellow-500/10 text-yellow-400 p-5 rounded-2xl text-center border border-yellow-500/20 font-black uppercase text-[11px] animate-fade-in flex items-center justify-center gap-3 shadow-lg shadow-yellow-500/5">
                <div className="w-7 h-7 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                Menunggu Verifikasi Admin
              </div>
            ) : (
              <div className="hidden md:flex gap-4 animate-slide-up" style={{ animationDelay: '0.15s' }}>
                <button onClick={() => addToCart(game.id)}
                  className="flex-1 bg-zinc-900/60 border border-white/[0.06] py-5 rounded-2xl font-black text-[11px] uppercase active-scale hover:bg-zinc-800/60 hover:border-purple-500/30 transition-all duration-300 shadow-xl flex items-center justify-center gap-3 group">
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </button>
                <button onClick={() => handleBuy()}
                  className="flex-[2] bg-gradient-to-r from-purple-600 to-purple-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase active-scale hover:from-purple-500 hover:to-purple-400 transition-all duration-300 shadow-[0_20px_50px_-15px_rgba(168,85,247,0.25)] hover:shadow-[0_20px_60px_-10px_rgba(168,85,247,0.4)] flex items-center justify-center gap-3 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="relative z-10">Instant Unlock Access</span>
                </button>
              </div>
            )}

            <section className="pt-16 space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Community <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Feedback</span>
                </h3>
                <div className="bg-zinc-900/60 border border-white/[0.06] px-5 py-2.5 rounded-2xl flex items-center gap-3 hover:border-yellow-500/20 transition-all">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-lg font-black text-yellow-400">{avgRating}</span>
                </div>
              </div>

              {user && (
                <div className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-purple-500 rounded-full" />
                    <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.3em]">Rate this game</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n}
                          onClick={() => setSelectedRating(n)}
                          onMouseEnter={() => setHoverRating(n)}
                          onMouseLeave={() => setHoverRating(0)}
                          className={`text-2xl transition-all duration-200 active-scale ${
                            (hoverRating || selectedRating) >= n
                              ? 'text-yellow-400 scale-110 drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]'
                              : 'text-gray-700 hover:text-yellow-500/50'
                          }`}>
                          ★
                        </button>
                      ))}
                    </div>
                    {selectedRating > 0 && (
                      <span className="text-[9px] font-black text-yellow-400">{selectedRating}/5</span>
                    )}
                  </div>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows="3"
                    className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4 text-sm outline-none focus:border-purple-500/40 transition-all font-medium text-white placeholder:text-gray-700 resize-none"
                    placeholder="Tulis review kamu..." />
                  <button onClick={submitReview} disabled={submittingReview}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest active-scale shadow-lg hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all duration-300 disabled:opacity-50">
                    {submittingReview ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        MENGIRIM
                      </span>
                    ) : 'Kirim Review'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 bg-white/[0.02] rounded-full animate-ping" />
                      <div className="absolute inset-2 bg-white/[0.03] rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-gray-600 uppercase text-[10px] font-black tracking-widest italic">No Feedback Yet</p>
                    <p className="text-gray-800 text-[8px] font-black uppercase tracking-wider mt-2">Be the first to review</p>
                  </div>
                ) : (
                  reviews.map((rev, i) => (
                    <div key={rev.id} className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-5 animate-slide-up transition-all duration-300 hover:border-white/[0.08]" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 p-[2px]">
                          <img src={rev.profiles?.avatar_url || getAvatarUrl(rev.profiles?.full_name || 'Hunter', 64)}
                            className="w-full h-full rounded-full object-cover border-2 border-black" alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[11px] font-black uppercase leading-tight truncate">{rev.profiles?.full_name || 'Vault Hunter'}</p>
                            <span className="text-[7px] text-gray-600 font-bold uppercase tracking-wider shrink-0">{new Date(rev.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mb-2">
                            {[1, 2, 3, 4, 5].map(s => (
                              <svg key={s} className={`w-3 h-3 ${s <= rev.rating ? 'text-yellow-400' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed font-medium">{rev.comment || 'Tidak ada komentar.'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {status !== 'approved' && status !== 'pending' && (
        <div className="md:hidden fixed bottom-[calc(72px+var(--sab))] left-0 right-0 z-[2000]">
          <div className="bg-gradient-to-t from-[#030303] via-[#030303]/95 to-transparent px-4 pt-12 pb-3">
            <div className="flex gap-3">
              <button onClick={() => addToCart(game.id)}
                className="flex-1 bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] py-4 rounded-2xl font-black text-[10px] uppercase active-scale hover:bg-zinc-800/80 transition-all flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Keranjang
              </button>
              <button onClick={() => handleBuy()}
                className="flex-[2] bg-gradient-to-r from-purple-600 to-purple-500 py-4 rounded-2xl font-black text-[10px] uppercase active-scale shadow-[0_15px_40px_rgba(168,85,247,0.4)] hover:shadow-[0_15px_60px_rgba(168,85,247,0.6)] transition-all duration-300 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Beli & Buka Akses
              </button>
            </div>
          </div>
        </div>
      )}

      <CartModal onCheckout={handleCheckout} />
      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} amount={paymentAmount} subtotal={paymentSubtotal} uniqueCode={paymentUniqueCode} />

      {isInstalling && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-xl" />
          <div className="relative w-full max-w-2xl animate-fade-in text-center flex flex-col items-center">
            {installStep < 3 ? (
              <>
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-4 border-purple-600/30 rounded-full animate-[spin_3s_linear_infinite]" />
                  <div className="absolute inset-2 border-4 border-t-purple-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-[spin_1.5s_ease-in-out_infinite]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl">⚡</span>
                  </div>
                </div>
                
                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">System Integration</h2>
                <div className="flex flex-col gap-2 mb-8 items-center">
                  <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.3em] mb-4 animate-pulse">
                    {installStep === 0 ? 'Mengirim Protokol GVR...' : installStep === 1 ? 'Menunggu engine lokal...' : 'Mengintegrasikan dengan Steam Library...'}
                  </p>
                  <div className="bg-purple-600/20 text-purple-300 px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest border border-purple-500/30">
                    1. Klik "Open" jika browser meminta izin.
                  </div>
                  <div className="bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest border border-blue-500/30">
                    2. Proses akan berjalan otomatis di latar belakang secara gaib.
                  </div>
                </div>
              </>
            ) : (
              <div className="animate-bounce-in flex flex-col items-center">
                <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center border-4 border-green-500/50 mb-8 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                  <span className="text-5xl">✅</span>
                </div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4 text-green-400 drop-shadow-lg">INSTALLATION SUCCESS</h2>
                <p className="text-[11px] text-gray-300 font-bold uppercase tracking-widest leading-relaxed mb-6 max-w-md">
                  Proses integrasi telah selesai! Game sudah berhasil ditambahkan ke dalam Steam Library kamu. Silakan buka Steam untuk mulai bermain.
                </p>
              </div>
            )}

            <button onClick={() => setIsInstalling(false)}
              className="mt-6 px-10 py-4 bg-white/[0.03] border border-white/10 hover:bg-white/10 rounded-full font-black text-[10px] uppercase tracking-widest transition-all">
              Tutup Layar Ini
            </button>
          </div>
        </div>
      )}

      {showEngineWarning && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          <div className="relative w-full max-w-md bg-zinc-900/95 border border-white/[0.06] rounded-3xl p-8 text-center animate-fade-in shadow-[0_0_50px_rgba(168,85,247,0.15)]">
            <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center border border-purple-500/30 mx-auto mb-6">
              <span className="text-4xl">⚙️</span>
            </div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-white">GVR Engine Dibutuhkan</h2>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8">
              Untuk menggunakan fitur 1-Click Install yang instan dan gaib, kamu harus menginstal GVR Engine terlebih dahulu (cukup 1x seumur hidup).
            </p>
            <div className="flex flex-col gap-3">
              <a href="/GVREngine_Setup.bat" download onClick={() => localStorage.setItem('gvr_engine_installed', 'true')}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition-colors">
                Download & Install Engine
              </a>
              <button onClick={proceedToInstall}
                className="w-full py-4 bg-white/[0.03] hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors">
                Saya Sudah Menginstalnya
              </button>
            </div>
            <button onClick={() => setShowEngineWarning(false)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
