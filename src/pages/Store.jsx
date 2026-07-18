import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HeroSlider from '../components/HeroSlider'
import GameCard from '../components/GameCard'
import Pagination from '../components/Pagination'
import CartModal from '../components/CartModal'
import PaymentModal from '../components/PaymentModal'
import InboxModal from '../components/InboxModal'
import ChatWidget from '../components/ChatWidget'
import SocialFloat from '../components/SocialFloat'
import AnimatedBackground from '../components/AnimatedBackground'
import { GameCardSkeleton } from '../components/Skeleton'
import { Helmet } from 'react-helmet-async'

const itemsPerPage = 20

export default function Store() {
  const { user } = useAuth()
  const { fetchCartCount } = useCart()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()

  const [games, setGames] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    setSearch(urlSearch)
  }, [searchParams])

  const [news, setNews] = useState([])
  const [featured, setFeatured] = useState([])

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentSubtotal, setPaymentSubtotal] = useState(0)
  const [paymentUniqueCode, setPaymentUniqueCode] = useState(0)
  const [inboxOpen, setInboxOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [liveSales, setLiveSales] = useState([])

  const storeRef = useRef(null)

  const fetchGames = useCallback(async (keyword = '') => {
    setLoading(true)
    try {
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      let query = supabase
        .from('games')
        .select('*', { count: 'exact' })
        .order('is_trending', { ascending: false })
        .order('created_at', { ascending: false })

      if (filter === 'trending') query = query.eq('is_trending', true)
      else if (['Online', 'Offline'].includes(filter)) query = query.eq('connectivity_type', filter)
      else if (filter !== 'all') query = query.ilike('genre', `%${filter}%`)

      if (keyword) query = query.ilike('title', `%${keyword}%`)

      const { data, count, error } = await query.range(from, to)
      if (error) throw error

      const { data: settings } = await supabase.from('settings').select('*')
      const releaseTimeStr = settings?.find(s => s.key === 'release_time')?.value
      const now = new Date()
      const target = new Date()
      if (releaseTimeStr) {
        const [h, m, s] = releaseTimeStr.split(':')
        target.setHours(h, m, s || 0)
      }

      const filteredGames = data?.filter(g => {
        if (g.release_type === 'scheduled') return now.getTime() >= target.getTime()
        return true
      }) || []

      const ids = filteredGames.map(g => g.id)
      if (ids.length > 0) {
        const { data: ratings } = await supabase
          .from('reviews')
          .select('game_id, rating')
          .in('game_id', ids)
        const ratingMap = {}
        ratings?.forEach(r => {
          if (!ratingMap[r.game_id]) ratingMap[r.game_id] = []
          ratingMap[r.game_id].push(r.rating)
        })
        filteredGames.forEach(g => {
          const r = ratingMap[g.id] || []
          g.reviews = r
          g.avg_rating = r.length > 0 ? (r.reduce((a, b) => a + b, 0) / r.length).toFixed(1) : '0.0'
          g.review_count = r.length
        })
      }

      setGames(filteredGames)
      setTotalCount(count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, filter])

  useEffect(() => {
    fetchGames(search)

    const channel = supabase.channel('store_games_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        fetchGames(search)
        loadFeatured()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchGames, search])

  useEffect(() => {
    fetchCartCount()
    fetchNews()
    loadFeatured()

    const onMouse = e => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMouse)

    const saleChannel = supabase.channel('live_sales')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'library', filter: 'status=eq.approved' },
        async payload => {
          const { data: game } = await supabase.from('games').select('title').eq('id', payload.new.game_id).single()
          if (game) {
            setLiveSales(prev => [{ title: game.title, time: Date.now() }, ...prev].slice(0, 5))
            setTimeout(() => setLiveSales(prev => prev.filter(s => s.time !== Date.now())), 5000)
          }
        }
      )
      .subscribe()

    if (sessionStorage.getItem('showWelcome')) {
      setShowWelcome(true)
      sessionStorage.removeItem('showWelcome')
    }

    return () => { window.removeEventListener('mousemove', onMouse); supabase.removeChannel(saleChannel) }
  }, [])

  async function loadFeatured() {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('is_trending', true)
      .order('created_at', { ascending: false })
      .limit(8)
    const featuredData = data || []
    const ids = featuredData.map(g => g.id)
    if (ids.length > 0) {
      const { data: ratings } = await supabase
        .from('reviews')
        .select('game_id, rating')
        .in('game_id', ids)
      const ratingMap = {}
      ratings?.forEach(r => {
        if (!ratingMap[r.game_id]) ratingMap[r.game_id] = []
        ratingMap[r.game_id].push(r.rating)
      })
      featuredData.forEach(g => {
        const r = ratingMap[g.id] || []
        g.reviews = r
      })
    }
    setFeatured(featuredData)
  }

  async function fetchNews() {
    const { data } = await supabase.from('vault_news').select('*').order('created_at', { ascending: false }).limit(3)
    setNews(data || [])
  }

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return }
    const { data: items } = await supabase.from('cart').select('games(price, discount_price)').eq('user_id', user.id)
    if (!items?.length) return showToast('Cart is empty!', 'warning')
    const subtotal = items.reduce((sum, i) => sum + (i.games.discount_price || i.games.price), 0)
    const uniqueCode = 500
    const finalAmount = (Math.floor(subtotal / 1000) * 1000) + uniqueCode
    setPaymentSubtotal(subtotal)
    setPaymentUniqueCode(uniqueCode)
    setPaymentAmount(finalAmount)
    setPaymentOpen(true)
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const genres = ['Action', 'RPG', 'Horror', 'Adventure', 'Simulation']

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>GVR - Store</title><meta name="description" content="Browse GameVora's game catalog with filters, search, and exclusive deals. Find your next game today." /></Helmet>

      <AnimatedBackground />

      <Navbar />
      <SocialFloat />
      <ChatWidget />

      {/* Mouse-tracking ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0 transition-all duration-300"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(168,85,247,0.06), transparent 50%)`,
        }} />

      {/* Live sales ticker */}
      {liveSales.length > 0 && (
        <div className="fixed bottom-24 right-4 z-[999] space-y-2 pointer-events-none">
          {liveSales.map(sale => (
            <div key={sale.time}
              className="bg-zinc-900/90 backdrop-blur-xl border border-purple-500/20 rounded-2xl px-4 py-3 shadow-xl shadow-purple-600/10 animate-slide-up"
              style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[7px] font-black uppercase tracking-widest text-green-400">Just Purchased</span>
              </div>
              <p className="text-[11px] font-bold text-gray-200 mt-1">{sale.title}</p>
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-28">
        <HeroSlider games={games} />

        {/* News Broadcast */}
        <div className="mt-10 relative group bg-zinc-900/60 backdrop-blur-2xl border border-white/[0.04] rounded-3xl p-6 overflow-hidden hover:border-cyan-500/30 transition-all duration-500 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-[80px] group-hover:bg-cyan-500/20 transition-all duration-700 pointer-events-none" />
            <div className="absolute -bottom-20 left-1/4 w-60 h-60 bg-blue-600/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row gap-6">
              <div className="md:w-1/4 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/[0.04] pb-4 md:pb-0 md:pr-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                  </span>
                  <span className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.4em] drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">Network Live</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-2">Vault News <br/> Broadcast</h3>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Latest transmissions from GameVora HQ.</p>
              </div>

              <div className="md:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[220px] md:max-h-none overflow-y-auto custom-scrollbar pr-2">
                {news.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-8 text-gray-600 bg-black/20 rounded-2xl border border-dashed border-white/10">
                    <svg className="w-6 h-6 mb-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest">No incoming transmissions</span>
                  </div>
                ) : (
                  news.map((item, i) => (
                    <div
                      key={item.id}
                      className="group/item relative flex flex-col justify-between bg-black/40 border border-white/[0.04] rounded-2xl p-4 hover:bg-cyan-500/5 hover:border-cyan-500/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all duration-300"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-tr-2xl pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      <div>
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <span className="text-[8px] font-black bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded uppercase tracking-widest">{item.category}</span>
                          <span className="text-[8px] text-gray-600 font-mono uppercase shrink-0">{new Date(item.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}</span>
                        </div>
                        <h4 className="text-xs font-black uppercase text-white mb-1.5 line-clamp-1 group-hover/item:text-cyan-300 transition-colors">{item.title}</h4>
                        <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">{item.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        {/* Divider with scanline */}
        <div className="relative my-16">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.03]" />
          </div>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-scanline" />
          </div>
          <div className="relative flex justify-center">
            <div className="px-6 bg-[#030303] flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-purple-500/50 animate-pulse" />
              <span className="w-16 h-px bg-gradient-to-r from-purple-500/30 to-transparent" />
              <svg className="w-4 h-4 text-purple-500/30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="w-16 h-px bg-gradient-to-l from-purple-500/30 to-transparent" />
              <span className="w-2 h-2 rounded-full bg-blue-500/50 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <main ref={storeRef} id="store" className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 mt-16 md:mt-0 relative">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/80 border border-white/5 backdrop-blur-md shadow-lg shadow-black/50">
              <span className="w-2 h-2 bg-green-500 rounded-sm animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              <span className="text-gray-300 text-[10px] font-black uppercase tracking-[0.3em]">Secure Connection</span>
            </div>
            <div>
              <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none relative">
                <span className="text-white drop-shadow-lg">Vault</span>{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]">
                    Inventory
                  </span>
                  <span className="absolute inset-x-0 bottom-0 h-3 bg-purple-500/20 blur-md -z-10" />
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-3 tracking-widest uppercase flex items-center gap-3">
                <span className="w-6 h-px bg-gray-600" />
                {totalCount > 0 ? `${totalCount.toLocaleString('id-ID')} items decrypted and ready` : 'Awaiting decryption...'}
              </p>
            </div>
          </div>

          <div className="w-full md:w-80 relative z-10 group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative flex items-center bg-zinc-900 border border-white/10 rounded-2xl">
              <div className="pl-4 pr-2">
                <svg className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                value={search} 
                onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                placeholder="Search games..."
                className="w-full bg-transparent py-4 pr-4 outline-none text-sm font-bold text-white placeholder:text-gray-600 tracking-wide" 
              />
              {search && (
                <button onClick={() => { setSearch(''); setCurrentPage(1) }} className="pr-4 text-gray-500 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-12 no-scrollbar overflow-x-auto pb-2 relative z-10">
          {[
            { key: 'all', label: 'All Items' },
            { key: 'trending', label: '🔥 Trending' },
            { key: 'Online', label: '🌐 Online' },
            { key: 'Offline', label: '📦 Offline' },
          ].map(cat => {
            const isActive = filter === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => { setFilter(cat.key); setCurrentPage(1) }}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] border border-purple-400/50'
                    : 'bg-zinc-900/80 border border-white/5 text-gray-400 hover:text-white hover:border-white/20 hover:bg-zinc-800'
                }`}
              >
                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />}
                <span className="relative z-10">{cat.label}</span>
              </button>
            );
          })}
          
          <div className="w-px h-8 bg-white/10 mx-2" />
          
          <div className="relative group">
            <select
              value={filter}
              onChange={e => { setFilter(e.target.value); setCurrentPage(1) }}
              className="bg-zinc-900/80 border border-white/5 px-6 py-3 pr-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-300 outline-none cursor-pointer hover:border-purple-500/50 hover:bg-zinc-800 focus:border-purple-500/80 transition-all appearance-none shadow-lg"
            >
              <option value="all" className="bg-zinc-900">GENRES</option>
              {genres.map(g => (
                <option key={g} value={g} className="bg-zinc-900">{g}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-purple-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 min-h-[400px]">
          {loading ? (
            <>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <GameCardSkeleton />
                </div>
              ))}
            </>
          ) : games.length === 0 ? (
            <div className="col-span-full text-center py-32 bg-black/20 border border-white/5 rounded-3xl backdrop-blur-sm shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none mix-blend-overlay" />
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-2xl bg-red-500/5 border border-red-500/20 animate-pulse" />
                <div className="absolute inset-4 rounded-xl bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.3)]" />
                <svg className="relative w-10 h-10 text-red-500 mx-auto mt-[28px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-white text-2xl font-black uppercase tracking-widest drop-shadow-md">{search ? 'Signal Lost' : 'Vault Empty'}</p>
              <p className="text-gray-400 text-sm font-medium mt-3 max-w-md mx-auto leading-relaxed">
                {search ? `Tidak ada data game yang cocok dengan pencarian "${search}". Silakan gunakan kata kunci lain.` : 'Belum ada game yang tersedia di toko.'}
              </p>
              {search && (
                <button onClick={() => { setSearch(''); setCurrentPage(1) }}
                  className="mt-8 px-8 py-3.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all hover:scale-105 active:scale-95 shadow-lg">
                  Reset Scanner
                </button>
              )}
            </div>
          ) : (
            games.map((game, i) => (
              <div
                key={game.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="relative">
                  <div className={`absolute z-20 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-wider border backdrop-blur-sm ${
                    game.discount_price > 0 ? 'top-[72px] left-4' : 'top-4 left-4'
                  } ${
                    game.connectivity_type === 'Online'
                      ? 'bg-blue-600/80 border-blue-400/30 text-blue-200'
                      : 'bg-green-600/80 border-green-400/30 text-green-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${game.connectivity_type === 'Online' ? 'bg-blue-400' : 'bg-green-400'} animate-pulse`} />
                    {game.connectivity_type || 'Offline'}
                  </div>
                  <GameCard game={game} />
                </div>
              </div>
            ))
          )}
        </div>

        {games.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => {
            setCurrentPage(p)
            storeRef.current?.scrollIntoView({ behavior: 'smooth' })
          }} />
        )}
      </main>

      <CartModal onCheckout={handleCheckout} />
      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} amount={paymentAmount} subtotal={paymentSubtotal} uniqueCode={paymentUniqueCode} />
      <InboxModal open={inboxOpen} onClose={() => setInboxOpen(false)} />

      {showWelcome && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 font-mono">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl animate-fade-in" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none mix-blend-overlay" />
          
          <div className="relative w-full max-w-md bg-zinc-900/90 border border-purple-500/30 rounded-[32px] p-8 text-center shadow-[0_0_50px_rgba(168,85,247,0.3)] overflow-hidden animate-fade-up">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-600/20 rounded-full blur-[60px] pointer-events-none animate-pulse" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-black/50 border-2 border-purple-500/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(168,85,247,0.4)] relative">
                <div className="absolute inset-0 bg-purple-500/10 rounded-2xl animate-ping" />
                <svg className="w-10 h-10 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                Access <span className="text-purple-400">Granted</span>
              </h2>
              
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-xl mb-6">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[10px] text-purple-300 font-bold uppercase tracking-widest">
                  Welcome to GameVora Vault
                </span>
              </div>
              
              <p className="text-xs text-gray-400 leading-relaxed mb-8 px-4 font-sans">
                Koneksi ke server utama berhasil didirikan. Selamat mengeksplorasi dan berburu di brankas digital ini!
              </p>
              
              <button onClick={() => setShowWelcome(false)}
                className="group relative w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 overflow-hidden border border-white/10 active:scale-95">
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-shimmer" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  INITIALIZE SYSTEM
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <Footer />
    </div>
  )
}
