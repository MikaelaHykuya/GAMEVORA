import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Helmet } from 'react-helmet-async'
import { useToast } from '../contexts/ToastContext'

export default function Giveaways() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [giveaways, setGiveaways] = useState([])
  const [joined, setJoined] = useState(new Set())
  const [joining, setJoining] = useState(null)
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGiveaways()
  }, [user])

  const fetchGiveaways = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('giveaways')
        .select('*, games(title, thumbnail)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      if (error) throw error
      const active = (data || []).filter(g => new Date(g.ends_at).getTime() > Date.now())
      setGiveaways(active)

      if (user) {
        const { data: entries } = await supabase
          .from('giveaway_entries')
          .select('giveaway_id')
          .eq('user_id', user.id)
        setJoined(new Set((entries || []).map(e => e.giveaway_id)))
      }
    } catch (err) {
      console.error('Failed to fetch giveaways:', err)
    }
    setLoading(false)
  }

  const joinGiveaway = async (giveawayId, endsAt) => {
    if (!user) { navigate('/login'); return }
    if (new Date(endsAt).getTime() <= Date.now()) {
      showToast('Giveaway ini sudah berakhir!', 'warning')
      return
    }
    setJoining(giveawayId)
    const { error } = await supabase.from('giveaway_entries').insert([{
      giveaway_id: giveawayId,
      user_id: user.id,
    }])
    if (error) {
      if (error.code === '23505') {
        showToast('Kamu sudah join giveaway ini!', 'warning')
      } else {
        showToast('Gagal join giveaway. Silakan coba lagi.', 'error')
      }
    } else {
      setJoined(prev => new Set(prev).add(giveawayId))
    }
    setJoining(null)
  }

  // Timer component to update dynamically
  const CountdownTimer = ({ endsAt }) => {
    const [timeLeft, setTimeLeft] = useState('')
    const [isEndingSoon, setIsEndingSoon] = useState(false)

    useEffect(() => {
      const interval = setInterval(() => {
        const diff = new Date(endsAt).getTime() - Date.now()
        if (diff <= 0) {
          setTimeLeft('Ended')
          setIsEndingSoon(true)
        } else {
          const h = Math.floor(diff / 3600000)
          const m = Math.floor((diff % 3600000) / 60000)
          const s = Math.floor((diff % 60000) / 1000)
          setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
          if (h < 1) setIsEndingSoon(true)
        }
      }, 1000)
      return () => clearInterval(interval)
    }, [endsAt])

    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-md ${isEndingSoon ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isEndingSoon ? 'bg-red-500' : 'bg-cyan-500'} animate-pulse`} />
        <span className="font-mono text-[9px] font-black uppercase tracking-widest">{timeLeft || 'CALCULATING...'}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>GVR - Vault Drops</title><meta name="description" content="Exclusive GameVora Vault Drops & Giveaways" /></Helmet>
      
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-pink-600/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-white/[0.02]" />
      </div>

      <Navbar />
      
      <main className="max-w-6xl mx-auto pt-32 px-4 md:px-6 pb-24 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/80 border border-white/5 backdrop-blur-md shadow-lg shadow-black/50 mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
            </span>
            <span className="text-pink-300 text-[10px] font-black uppercase tracking-[0.4em]">Limited Time Events</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 relative">
            <span className="text-white drop-shadow-lg">Vault</span>{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]">
                Drops
              </span>
              <span className="absolute inset-x-0 bottom-2 h-4 bg-pink-500/20 blur-md -z-10" />
            </span>
          </h1>
          
          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed">
            Amankan loot eksklusif. Bergabunglah dalam undian transmisi kami untuk mendapatkan akses game gratis ke dalam vault-mu secara permanen.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-white/5" />
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-white/5 rounded w-1/4" />
                  <div className="h-6 bg-white/5 rounded w-3/4" />
                  <div className="h-4 bg-white/5 rounded w-full" />
                  <div className="h-12 bg-white/5 rounded-2xl w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : giveaways.length === 0 ? (
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/[0.04] rounded-[32px] p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay" />
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-2 border-dashed border-gray-600 rounded-full animate-spin-slow" />
              <div className="absolute inset-2 border border-gray-700 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <p className="text-xl font-black uppercase tracking-widest text-white mb-2">No Active Drops</p>
            <p className="text-sm text-gray-500 font-medium">Radar tidak mendeteksi giveaway yang sedang berlangsung saat ini. Pantau terus transmisi berikutnya.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {giveaways.map((g, index) => {
              const hasJoined = joined.has(g.id);
              const isJoining = joining === g.id;
              
              return (
                <div key={g.id} className="group relative bg-zinc-900/60 backdrop-blur-xl border border-white/[0.06] rounded-[32px] overflow-hidden transition-all duration-500 hover:border-pink-500/40 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:-translate-y-1 animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  
                  {/* Image Header */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-zinc-800">
                    {g.games?.thumbnail ? (
                      <img src={g.games.thumbnail} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                        <svg className="w-16 h-16 text-white/10" fill="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                    
                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                      <div className="bg-purple-500/20 backdrop-blur-md border border-purple-500/30 text-purple-300 text-[8px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                        {g.winner_count} Winner{g.winner_count > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 z-10">
                      <CountdownTimer endsAt={g.ends_at} />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 relative z-10">
                    <h3 className="text-xl font-black uppercase tracking-tight leading-tight mb-3 text-white group-hover:text-pink-400 transition-colors">{g.title}</h3>
                    {g.description && <p className="text-sm text-gray-400 leading-relaxed mb-6 line-clamp-2">{g.description}</p>}
                    
                    {/* Target Game Info */}
                    <div className="flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-2xl mb-6">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center border border-pink-500/20 shrink-0">
                        <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Target Reward</p>
                        <p className="text-xs font-bold text-gray-200 truncate">{g.games?.title || 'Unknown Asset'}</p>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <button 
                      onClick={() => joinGiveaway(g.id, g.ends_at)} 
                      disabled={hasJoined || isJoining || new Date(g.ends_at).getTime() <= Date.now()}
                      className={`w-full relative overflow-hidden py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-100 disabled:cursor-default active:scale-95 group/btn ${
                        hasJoined 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]'
                      }`}
                    >
                      {!hasJoined && <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:animate-shimmer" />}
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isJoining ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            UPLOADING...
                          </>
                        ) : hasJoined ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                            ACCESS GRANTED
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                            ENTER DROPS
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
