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
      
      <div className="flex-grow flex items-center justify-center relative max-w-7xl mx-auto px-4 md:px-6 pt-32 pb-24 w-full">
        <div className="animate-fade-in relative z-10 w-full">
          <div className="text-center mb-16 relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-purple-500/20 mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Welcome to the Future of Gaming</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-[100px] font-black uppercase tracking-tight mb-6 leading-[0.9] animate-slide-up">
              Play Premium Games <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                Without Limits.
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-gray-400 text-sm md:text-base leading-relaxed mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              GameVora adalah platform revolusioner yang memberimu akses ke ribuan game PC original di Steam dengan harga yang sangat terjangkau. Tidak perlu lagi membajak, mainkan game favoritmu secara resmi!
            </p>
            <div className="flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              {user ? (
                <Link to="/store" className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-black text-[12px] uppercase tracking-widest hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all hover:-translate-y-1">
                  Masuk ke Vault / Store
                </Link>
              ) : (
                <>
                  <Link to="/store" className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-black text-[12px] uppercase tracking-widest hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all hover:-translate-y-1">
                    Mulai Bermain Sekarang
                  </Link>
                  <Link to="/login" className="px-10 py-5 glass-card rounded-full font-black text-[12px] uppercase tracking-widest hover:bg-white/10 transition-all text-white hover:-translate-y-1">
                    Login ke Akun
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {[
              { icon: '⚡', title: '1-Click Install', desc: 'Teknologi VoraTools mengintegrasikan game langsung ke Steam Library-mu secara gaib hanya dengan satu klik.' },
              { icon: '🛡️', title: '100% Original', desc: 'Bukan game bajakan. Nikmati fitur resmi Steam, Update Otomatis, dan Multiplayer Online tanpa batas.' },
              { icon: '💾', title: 'Cloud Sync', desc: 'Semua progress permainanmu (Save Data) tersimpan aman secara otomatis di server Steam Cloud.' },
              { icon: '💰', title: 'Hemat 90%', desc: 'Mainkan game-game AAA dengan harga super murah. Kualitas premium tanpa menguras dompet.' }
            ].map((feat, i) => (
              <div key={i} className="reveal glass-card-premium rounded-3xl p-6 group"
                style={{ transitionDelay: `${0.1 + i * 0.1}s`, animationDelay: `${0.1 + i * 0.1}s` }}>
                <div className="w-12 h-12 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:bg-purple-500/20 group-hover:border-purple-500/40 transition-all duration-500">
                  {feat.icon}
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight mb-3 text-white group-hover:text-purple-300 transition-colors">{feat.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SocialFloat />
      <ChatWidget />      <Footer />
    </div>
  )
}
