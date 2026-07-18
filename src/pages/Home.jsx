import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ChatWidget from '../components/ChatWidget'
import SocialFloat from '../components/SocialFloat'
import AnimatedBackground from '../components/AnimatedBackground'
import { Helmet } from 'react-helmet-async'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen text-white flex flex-col">
      <AnimatedBackground />
      <Helmet><title>GVR - Digital Vault</title><meta name="description" content="GameVora - Digital vault for premium games. Discover, purchase, and download your favorite games instantly." /></Helmet>

      <Navbar />
      
      <div className="flex-grow relative w-full overflow-hidden">
        
        {/* Dynamic Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-60 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen opacity-40 animate-float" />
        <div className="absolute top-60 left-10 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen opacity-40 animate-float" style={{ animationDelay: '2s' }} />

        {/* HERO SECTION */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-32 md:pt-48 pb-20 md:pb-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 mb-10 backdrop-blur-md animate-fade-in hover:bg-white/10 transition-colors cursor-default">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-gray-300">Welcome to the Future of Gaming</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-[110px] font-black uppercase tracking-tighter mb-8 leading-[0.9] animate-slide-up relative">
            <span className="text-white drop-shadow-2xl">Play Premium Games</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 drop-shadow-[0_0_40px_rgba(168,85,247,0.4)] relative">
              Without Limits.
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-20 blur-2xl -z-10" />
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-gray-400 text-sm md:text-lg font-medium leading-relaxed mb-12 animate-fade-in px-4" style={{ animationDelay: '0.2s' }}>
            GameVora adalah platform <strong className="text-white">Digital Vault</strong> revolusioner. Dapatkan akses eksklusif ke ribuan game PC original di Steam dengan harga yang jauh lebih terjangkau. Tidak perlu bajakan, mainkan secara resmi!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto animate-slide-up px-4" style={{ animationDelay: '0.3s' }}>
            {user ? (
              <>
                <Link to="/store" className="w-full sm:w-auto px-10 py-5 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.2em] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                  Masuk ke Vault
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
                <Link to="/affiliate/apply" className="w-full sm:w-auto px-10 py-5 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/30 transition-all text-white flex items-center justify-center gap-2">
                  Daftar Affiliate
                </Link>
              </>
            ) : (
              <>
                <Link to="/store" className="w-full sm:w-auto px-10 py-5 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.2em] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                  Mulai Bermain
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
                <Link to="/login" className="w-full sm:w-auto px-10 py-5 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/30 transition-all text-white flex items-center justify-center gap-2">
                  Login ke Akun
                </Link>
              </>
            )}
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-20 border-t border-white/[0.05]">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 text-white">How It Works</h2>
            <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">Tiga langkah mudah untuk mulai bermain game impianmu.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 -translate-y-1/2 -z-10" />
            
            {[
              { step: '01', title: 'Pilih Game', desc: 'Jelajahi vault kami dan beli akses game premium dengan harga super miring.', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
              { step: '02', title: '1-Click Install', desc: 'Gunakan teknologi VoraTools kami untuk mengintegrasikan game langsung ke Steam.', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
              { step: '03', title: 'Mulai Bermain', desc: 'Mainkan game secara resmi, nikmati update otomatis & fitur Steam seutuhnya.', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' }
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-3xl bg-zinc-900/80 border border-white/10 backdrop-blur-xl flex items-center justify-center relative mb-6 shadow-2xl group-hover:border-purple-500/50 group-hover:scale-110 transition-all duration-500">
                  <div className="absolute inset-0 bg-purple-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <svg className="w-8 h-8 text-white relative z-10 group-hover:text-purple-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={s.icon} /></svg>
                  <span className="absolute -top-3 -right-3 text-[10px] font-black uppercase bg-purple-500 text-white px-2 py-1 rounded-lg shadow-lg">{s.step}</span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-wide text-white mb-3 group-hover:text-purple-300 transition-colors">{s.title}</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BENTO GRID FEATURES SECTION */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-20 mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 text-white">Why GameVora?</h2>
            <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">Kami mendefinisikan ulang cara kamu membeli dan memainkan game PC.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Feature 1 (Large Span) */}
            <div className="md:col-span-2 md:row-span-2 group bg-zinc-900/40 border border-white/[0.04] rounded-[32px] p-8 md:p-12 hover:bg-zinc-900/60 transition-all duration-500 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-purple-600/20 transition-all duration-700" />
              <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <span className="text-3xl">⚡</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4 text-white">1-Click Install Magic</h3>
                <p className="text-gray-400 text-sm md:text-base max-w-md leading-relaxed">
                  Teknologi VoraTools mengintegrasikan game langsung ke Steam Library-mu secara gaib hanya dengan satu klik. Lupakan proses instalasi yang ribet.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group bg-zinc-900/40 border border-white/[0.04] rounded-[32px] p-8 hover:bg-zinc-900/60 transition-all duration-500 relative overflow-hidden backdrop-blur-md">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-all" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🛡️</span>
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-white">100% Original</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Bukan game bajakan. Nikmati fitur resmi Steam & Multiplayer.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group bg-zinc-900/40 border border-white/[0.04] rounded-[32px] p-8 hover:bg-zinc-900/60 transition-all duration-500 relative overflow-hidden backdrop-blur-md">
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/10 rounded-full blur-[40px] group-hover:bg-pink-500/20 transition-all" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-2xl">💾</span>
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-white">Cloud Sync</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Save data tersimpan aman secara otomatis di server Steam Cloud.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4 (Wide Span) */}
            <div className="md:col-span-3 group bg-gradient-to-r from-zinc-900/80 to-zinc-900/40 border border-white/[0.04] rounded-[32px] p-8 md:p-10 hover:border-white/[0.1] transition-all duration-500 relative overflow-hidden backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="absolute top-0 right-1/4 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 mb-4">
                  <span className="text-lg">💰</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Best Value</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2 text-white">Hemat hingga 90%</h3>
                <p className="text-gray-400 text-sm max-w-md leading-relaxed">
                  Mainkan game-game AAA dengan harga super murah. Kualitas premium tanpa harus menguras isi dompetmu.
                </p>
              </div>

              <Link to="/store" className="relative z-10 px-8 py-4 bg-white text-black rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
                Lihat Katalog Game
              </Link>
            </div>
          </div>
        </section>

      </div>

      <SocialFloat />
      <ChatWidget />
      <Footer />
    </div>
  )
}
