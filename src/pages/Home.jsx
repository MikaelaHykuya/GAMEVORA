import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ChatWidget from '../components/ChatWidget'
import SocialFloat from '../components/SocialFloat'
import AnimatedBackground from '../components/AnimatedBackground'
import { Helmet } from 'react-helmet-async'
import { supabase } from '@lib/supabase'
import GameCard from '../components/GameCard'
import { GameCardSkeleton } from '../components/Skeleton'

export default function Home() {
  const { user } = useAuth()
  const [trendingGames, setTrendingGames] = useState([])
  const [loadingTrending, setLoadingTrending] = useState(true)

  useEffect(() => {
    async function fetchTrending() {
      try {
        setLoadingTrending(true)
        const { data } = await supabase
          .from('games')
          .select('*')
          .eq('is_trending', true)
          .order('created_at', { ascending: false })
          .limit(4)
        
        if (data) {
          // Fetch ratings
          const ids = data.map(g => g.id)
          const { data: ratings } = await supabase.from('reviews').select('game_id, rating').in('game_id', ids)
          const ratingMap = {}
          if (ratings) {
            ratings.forEach(r => {
              if (!ratingMap[r.game_id]) ratingMap[r.game_id] = []
              ratingMap[r.game_id].push(r.rating)
            })
          }
          const gamesWithRatings = data.map(g => ({
            ...g,
            reviews: ratingMap[g.id] || []
          }))
          setTrendingGames(gamesWithRatings)
        }
      } catch (err) {
        console.error('Error fetching trending:', err)
      } finally {
        setLoadingTrending(false)
      }
    }
    fetchTrending()
  }, [])

  return (
    <div className="min-h-screen text-white flex flex-col bg-[#05050A]">
      <AnimatedBackground />
      <Helmet><title>GVR - Premium Digital Vault</title><meta name="description" content="GameVora - Premium digital vault for games." /></Helmet>

      <Navbar />
      
      <div className="flex-grow relative w-full overflow-hidden">
        
        {/* Dynamic Glow Backgrounds */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-purple-700/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen opacity-50 animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-20 right-[-10%] w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-40 animate-float" />
        <div className="absolute top-60 left-[-10%] w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-40 animate-float" style={{ animationDelay: '2s' }} />

        {/* HERO SECTION */}
        <section className="relative z-10 w-[95%] lg:w-[90%] 2xl:w-[85%] max-w-none mx-auto px-4 md:px-6 pt-40 md:pt-52 pb-24 md:pb-40 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-xl animate-fade-in hover:bg-white/10 hover:border-white/20 transition-all cursor-default shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-gray-300">Welcome to the Next Era</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-[120px] font-black uppercase tracking-tighter mb-8 leading-[0.85] animate-slide-up relative z-10">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-400 drop-shadow-2xl">Digital</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 relative inline-block drop-shadow-[0_0_40px_rgba(168,85,247,0.6)] mt-2">
              Premium Vault
              {/* Text Glow behind */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 blur-[60px] opacity-30 -z-10 mix-blend-screen" />
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-gray-400 text-sm md:text-lg font-medium leading-relaxed mb-12 animate-fade-in px-4" style={{ animationDelay: '0.2s' }}>
            Mainkan ribuan game PC original dengan fitur <strong className="text-white">1-Click Install Magic</strong>. Akses library eksklusif kami dan nikmati pengalaman bermain tanpa batas.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto animate-slide-up px-4" style={{ animationDelay: '0.3s' }}>
            {user ? (
              <>
                <Link to="/store" className="relative group w-full sm:w-auto px-10 py-5 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-blue-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10">Masuk ke Vault</span>
                  <svg className="w-5 h-5 relative z-10 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
                <Link to="/affiliate/apply" className="w-full sm:w-auto px-10 py-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/30 transition-all text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                  Daftar Affiliate
                </Link>
              </>
            ) : (
              <>
                <Link to="/store" className="relative group w-full sm:w-auto px-10 py-5 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-blue-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10">Mulai Bermain</span>
                  <svg className="w-5 h-5 relative z-10 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
                <Link to="/login" className="w-full sm:w-auto px-10 py-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/30 transition-all text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                  Login ke Akun
                </Link>
              </>
            )}
          </div>
        </section>

        {/* TRENDING SHOWCASE SECTION */}
        <ScrollReveal>
          <section className="relative z-10 w-[95%] lg:w-[90%] 2xl:w-[85%] max-w-none mx-auto px-4 md:px-6 pb-32">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
              <div>
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                  <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                  Trending Now
                </h2>
                <p className="text-gray-400 text-sm mt-2 font-medium">Game paling dicari bulan ini.</p>
              </div>
              <Link to="/store?filter=trending" className="px-6 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-black text-xs uppercase tracking-widest hover:bg-purple-500/20 transition-colors flex items-center gap-2">
                Lihat Semua <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {loadingTrending ? (
                Array(4).fill(0).map((_, i) => <GameCardSkeleton key={i} />)
              ) : trendingGames.length > 0 ? (
                trendingGames.map((game, i) => (
                  <ScrollReveal key={game.id} delay={i * 0.1}>
                    <GameCard game={game} />
                  </ScrollReveal>
                ))
              ) : (
                <div className="col-span-full py-10 text-center text-gray-500 font-bold uppercase tracking-widest">
                  Belum ada game trending
                </div>
              )}
            </div>
          </section>
        </ScrollReveal>

        {/* HOW IT WORKS SECTION */}
        <ScrollReveal>
        <section className="relative z-10 w-[95%] lg:w-[90%] 2xl:w-[85%] max-w-none mx-auto px-4 md:px-6 pb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 text-white">How It Works</h2>
            <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">Tiga langkah mudah untuk mulai bermain game impianmu.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 -translate-y-1/2 -z-10" />
            
            {[
              { step: '01', title: 'Pilih Game', desc: 'Jelajahi vault kami dan beli akses game premium dengan harga super miring.', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
              { step: '02', title: '1-Click Install', desc: 'Gunakan teknologi VoraTools kami untuk mengintegrasikan game langsung ke Steam.', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
              { step: '03', title: 'Mulai Bermain', desc: 'Mainkan game secara resmi, nikmati update otomatis & fitur Steam seutuhnya.', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' }
            ].map((s, i) => (
              <ScrollReveal key={i} delay={i * 0.2} direction="up" className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-[2rem] bg-[#0A0A0C]/80 border border-white/[0.08] backdrop-blur-3xl flex items-center justify-center relative mb-8 shadow-2xl shadow-black group-hover:border-purple-500/50 group-hover:scale-110 transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <svg className="w-10 h-10 text-white relative z-10 group-hover:text-purple-300 transition-colors drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={s.icon} /></svg>
                  <span className="absolute -top-1 -right-1 text-[10px] font-black uppercase bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1.5 rounded-xl shadow-lg border border-white/20">{s.step}</span>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-wide text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 transition-all">{s.title}</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs">{s.desc}</p>
              </ScrollReveal>
            ))}
          </div>
        </section>
        </ScrollReveal>

        {/* BENTO GRID FEATURES SECTION */}
        <section className="relative z-10 w-[95%] lg:w-[90%] 2xl:w-[85%] max-w-none mx-auto px-4 md:px-6 pb-20 mb-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 text-white">Why GameVora?</h2>
            <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">Kami mendefinisikan ulang cara kamu membeli dan memainkan game PC.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[280px]">
            {/* Feature 1 (Large Span) */}
            <ScrollReveal delay={0.1} direction="left" className="min-h-[350px] md:min-h-0 md:col-span-2 md:row-span-2 group bg-[#0A0A0C]/70 border border-white/[0.08] rounded-[2.5rem] p-10 md:p-14 hover:bg-[#0A0A0C]/90 transition-all duration-500 relative overflow-hidden backdrop-blur-2xl shadow-2xl shadow-black/50">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-600/25 transition-all duration-700" />
              <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="w-20 h-20 bg-white/[0.02] border border-white/[0.1] rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <svg className="w-10 h-10 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6 text-white group-hover:text-purple-100 transition-colors">1-Click<br />Install Magic</h3>
                <p className="text-gray-400 text-sm md:text-lg max-w-md leading-relaxed">
                  Teknologi VoraTools mengintegrasikan game langsung ke Steam Library-mu secara gaib hanya dengan satu klik. Lupakan proses instalasi yang ribet.
                </p>
              </div>
            </ScrollReveal>

            {/* Feature 2 */}
            <ScrollReveal delay={0.3} direction="up" className="min-h-[250px] md:min-h-0 group bg-[#0A0A0C]/70 border border-white/[0.08] rounded-[2.5rem] p-8 md:p-10 hover:bg-[#0A0A0C]/90 transition-all duration-500 relative overflow-hidden backdrop-blur-2xl shadow-2xl shadow-black/50">
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-500/10 rounded-full blur-[50px] group-hover:bg-blue-500/30 transition-all duration-700" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-14 h-14 bg-white/[0.02] border border-white/[0.1] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <svg className="w-7 h-7 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-3 text-white">100% Original</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Bukan game bajakan. Nikmati fitur resmi Steam & Multiplayer.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 3 */}
            <ScrollReveal delay={0.5} direction="right" className="min-h-[250px] md:min-h-0 group bg-[#0A0A0C]/70 border border-white/[0.08] rounded-[2.5rem] p-8 md:p-10 hover:bg-[#0A0A0C]/90 transition-all duration-500 relative overflow-hidden backdrop-blur-2xl shadow-2xl shadow-black/50">
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-pink-500/10 rounded-full blur-[50px] group-hover:bg-pink-500/30 transition-all duration-700" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-14 h-14 bg-white/[0.02] border border-white/[0.1] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <svg className="w-7 h-7 text-pink-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-3 text-white">Cloud Sync</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Save data tersimpan aman secara otomatis di server Steam Cloud.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 4 (Wide Span) */}
            <ScrollReveal delay={0.2} direction="up" className="min-h-[250px] md:min-h-0 md:col-span-3 group bg-gradient-to-r from-zinc-900/90 to-[#0A0A0C]/80 border border-white/[0.08] rounded-[2.5rem] p-10 md:p-14 hover:border-white/[0.2] transition-all duration-500 relative overflow-hidden backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-black">
              <div className="absolute top-0 right-1/4 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 mb-5 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Best Value</span>
                </div>
                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 text-white group-hover:text-green-300 transition-colors">Hemat hingga 90%</h3>
                <p className="text-gray-400 text-sm md:text-lg max-w-2xl leading-relaxed">
                  Mainkan game-game AAA dengan harga super murah. Kualitas premium tanpa harus menguras isi dompetmu.
                </p>
              </div>

              <Link to="/store" className="relative z-10 px-10 py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
                Lihat Katalog Game
              </Link>
            </ScrollReveal>
          </div>
        </section>

        {/* TRUST / STATS SECTION */}
        <ScrollReveal>
          <section className="relative z-10 w-full bg-gradient-to-t from-[#0A0A0C] to-transparent py-20 border-t border-white/[0.02]">
            <div className="w-[95%] lg:w-[90%] 2xl:w-[85%] max-w-none mx-auto px-4 md:px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x divide-white/[0.05]">
                <div className="flex flex-col items-center text-center px-4">
                  <h4 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 mb-2">10K+</h4>
                  <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">Active Gamers</p>
                </div>
                <div className="flex flex-col items-center text-center px-4">
                  <h4 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-blue-500 mb-2">500+</h4>
                  <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">Premium Games</p>
                </div>
                <div className="flex flex-col items-center text-center px-4">
                  <h4 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600 mb-2">100%</h4>
                  <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">Safe & Secure</p>
                </div>
                <div className="flex flex-col items-center text-center px-4">
                  <h4 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-pink-400 to-rose-500 mb-2">24/7</h4>
                  <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">Support Ready</p>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

      </div>

      <SocialFloat />
      <ChatWidget />
      <Footer />
    </div>
  )
}
