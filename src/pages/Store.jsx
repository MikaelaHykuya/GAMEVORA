import { useState, useEffect, useRef, useCallback } from 'react'
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
        <div className="mt-10 relative group glass-card-premium rounded-3xl p-6 overflow-hidden hover:border-blue-500/20 transition-all duration-500">
            <div className="absolute top-0 right-0 w-60 h-60 bg-blue-600/10 rounded-full blur-[80px] group-hover:bg-blue-600/15 transition-all duration-700" />
            <div className="absolute -bottom-20 left-1/3 w-40 h-40 bg-cyan-600/8 rounded-full blur-[60px]" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]">Global News Broadcast</span>
              </div>
              <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar pr-2">
                {news.length === 0 ? (
                  <div className="flex items-center gap-3 py-8 text-gray-600">
                    <div className="w-10 h-10 border border-white/[0.06] rounded-xl flex items-center justify-center bg-white/[0.02]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">No transmissions...</span>
                  </div>
                ) : (
                  news.map((item, i) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between border border-white/[0.02] rounded-2xl p-3 hover:bg-blue-500/5 hover:border-blue-500/10 transition-all duration-300"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[7px] font-black bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-lg uppercase tracking-wider">{item.category}</span>
                          <span className="text-[10px] font-bold uppercase truncate">{item.title}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 leading-relaxed">{item.content}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <span className="text-[7px] text-gray-700 font-black uppercase whitespace-nowrap">{new Date(item.created_at).toLocaleDateString()}</span>
                        <div className="w-2 h-2 rounded-full bg-blue-500/20 group-hover:bg-blue-500/50 transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* Decorative line */}
            <div className="absolute top-0 right-0 w-1/3 h-px bg-gradient-to-l from-blue-500/20 to-transparent" />
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/15">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
              <span className="text-purple-400 text-[9px] font-black uppercase tracking-[0.5em]">Inventory Browser</span>
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none relative">
                <span className="absolute -left-2 top-0 w-1 h-full bg-gradient-to-b from-purple-500 via-pink-500 to-blue-500 rounded-full" />
                Vault{' '}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.3)] animate-gradient-x">
                  Items
                </span>
              </h2>
              <p className="text-[11px] text-gray-600 font-bold mt-2 tracking-wider">
                {totalCount > 0 ? `${totalCount.toLocaleString('id-ID')} games available` : 'Browse our collection'}
              </p>
            </div>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-1 md:w-72">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                placeholder="Search vault..."
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl pl-10 pr-4 py-3.5 outline-none focus:border-purple-500/40 focus:shadow-[0_0_20px_rgba(168,85,247,0.08)] transition-all text-sm text-white placeholder:text-gray-700" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-12 no-scrollbar overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All Items' },
            { key: 'trending', label: '🔥 Trending' },
            { key: 'Online', label: '🌐 Online' },
            { key: 'Offline', label: '📦 Offline' },
          ].map(cat => (
            <button
              key={cat.key}
              onClick={() => { setFilter(cat.key); setCurrentPage(1) }}
              className={`px-5 py-3 rounded-full text-[9px] font-black uppercase transition-all duration-300 ${
                filter === cat.key
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg shadow-purple-600/25 text-white scale-105'
                  : 'bg-zinc-900/60 border border-white/[0.06] text-gray-400 hover:text-white hover:border-white/[0.15] hover:bg-zinc-900/80 hover:-translate-y-0.5'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <div className="w-px h-6 bg-white/[0.06] mx-1" />
          <div className="relative">
            <select
              value={filter}
              onChange={e => { setFilter(e.target.value); setCurrentPage(1) }}
              className="bg-zinc-900/60 border border-white/[0.06] px-5 py-3 pr-10 rounded-full text-[9px] font-black uppercase text-gray-400 outline-none cursor-pointer hover:border-white/[0.15] hover:bg-zinc-900/80 transition-all appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1em',
              }}
            >
              <option value="all" className="bg-zinc-900">All Genres</option>
              {genres.map(g => (
                <option key={g} value={g} className="bg-zinc-900">{g}</option>
              ))}
            </select>
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
            <div className="col-span-full text-center py-24">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-2xl bg-purple-500/5 border border-purple-500/10 animate-pulse" />
                <div className="absolute inset-3 rounded-xl bg-purple-500/10" />
                <svg className="relative w-8 h-8 text-purple-400 mx-auto mt-[24px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-300 text-lg font-black uppercase tracking-tight">{search ? 'No Results Found' : 'Vault Empty'}</p>
              <p className="text-gray-600 text-xs font-bold mt-2">
                {search ? `Tidak ada game untuk "${search}"` : 'Belum ada game di toko'}
              </p>
              {search && (
                <button onClick={() => { setSearch(''); setCurrentPage(1) }}
                  className="mt-6 px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-2xl text-[9px] font-black uppercase tracking-widest text-purple-300 hover:bg-purple-500/30 transition-all">
                  Clear Search
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
                  <div className={`absolute z-20 flex items-center gap-1 px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-wider border backdrop-blur-sm ${
                    game.discount_price > 0 ? 'top-[52px] left-3' : 'top-3 left-3'
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

      {showWelcome && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
          <div className="relative w-full max-w-sm bg-zinc-900/95 border border-white/[0.06] rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(168,85,247,0.2)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[40px] pointer-events-none" />
            <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-500/40">
              <span className="text-3xl">👋</span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-white">Selamat Datang!</h2>
            <p className="text-[11px] text-purple-300 font-bold uppercase tracking-widest mb-4 bg-purple-500/10 inline-block px-4 py-1 rounded-xl border border-purple-500/20">
              di GameVora
            </p>
            <p className="text-sm text-gray-400 leading-relaxed mb-8 mt-2">
              Akses ke Vault sekarang terbuka. Selamat bermain dan bereksplorasi!
            </p>
            <button onClick={() => setShowWelcome(false)}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all">
              Tutup & Mulai
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
