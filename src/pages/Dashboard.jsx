import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { GameCardSkeleton } from '../components/Skeleton'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { FaSearch, FaLockOpen, FaBook, FaBoxOpen, FaDownload, FaRocket, FaCheckCircle, FaTimes, FaCog } from 'react-icons/fa'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [vaultOpen, setVaultOpen] = useState(false)
  const [vaultGame, setVaultGame] = useState(null)
  const [vaultLinks, setVaultLinks] = useState([])
  const [vaultGuide, setVaultGuide] = useState('')
  const [voraLink, setVoraLink] = useState('')
  const [voraAppId, setVoraAppId] = useState('')
  const [isInstalling, setIsInstalling] = useState(false)
  const [installStep, setInstallStep] = useState(0)
  const [showEngineWarning, setShowEngineWarning] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    document.body.style.opacity = '1'

    let cancelled = false
    const safetyTimeout = setTimeout(() => { if (!cancelled) setLoading(false) }, 8000)

    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('library')
          .select('*, games(*)')
          .eq('user_id', user.id)
          .in('status', ['approved', 'completed'])
        if (error) {
          console.error('Library query error:', error)
          if (!cancelled) setLibrary([])
        } else {
          if (!cancelled) setLibrary(data || [])
        }
      } catch (err) {
        if (!cancelled) console.error('loadLibrary error:', err)
      } finally {
        if (!cancelled) setLoading(false)
        clearTimeout(safetyTimeout)
      }
    })()

    return () => { cancelled = true; clearTimeout(safetyTimeout) }
  }, [user])

  const openVault = async (gameId, showTutorial = false) => {
    const { data: game } = await supabase.from('games').select('*').eq('id', gameId).single()
    if (!game) return
    setVaultGame(game.title)
    setVaultLinks(game.download_links || [])
    setVaultGuide(game.manual_guide || 'Panduan belum tersedia.')
    setVoraLink(game.voratools_link || '')
    setVoraAppId(game.steam_appid || '')
    setVaultOpen(true)
    if (showTutorial) {
      setTimeout(() => {
        document.getElementById('guide-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }

  const handleAutoInstall = () => {
    if (!localStorage.getItem('gvr_engine_installed')) {
      setShowEngineWarning(true)
      return
    }

    setIsInstalling(true)
    setInstallStep(0)
    const scriptUrl = new URL('voratools.ps1', `${window.location.origin}${import.meta.env.BASE_URL}`).href
    
    const sB64 = encodeURIComponent(btoa(scriptUrl))
    const lB64 = encodeURIComponent(btoa(voraLink))
    const nB64 = encodeURIComponent(btoa(encodeURIComponent(vaultGame || 'Game')))
    const a = voraAppId || '0'
    
    const gvrUrl = `gvr://install/?s=${sB64}&l=${lB64}&a=${a}&n=${nB64}`
    
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

  const filteredLibrary = library.filter(item => {
    const title = item.games?.title?.toLowerCase() || ''
    const genre = item.games?.genre?.toLowerCase() || ''
    const q = search.toLowerCase()
    return title.includes(q) || genre.includes(q)
  })

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] text-white">
        <Navbar />
        <main className="pt-32 px-6 max-w-7xl mx-auto pb-8">
          <div className="mb-10">
            <div className="w-32 h-3 bg-zinc-800 rounded-full skeleton mb-4" />
            <div className="w-64 h-8 bg-zinc-800 rounded-xl skeleton mb-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white relative font-sans overflow-x-hidden">
      <Helmet><title>My Vault | GAMEVORA</title><meta name="description" content="Akses game milikmu di Vault." /></Helmet>
      
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-fuchsia-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <Navbar />
      
      <main className="pt-32 px-4 md:px-8 max-w-7xl mx-auto pb-24 relative z-10">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <FaBoxOpen className="text-purple-300" /> Authenticated Access
            </div>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400">
              The Vault
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-lg leading-relaxed">
              Selamat datang di brankas digitalmu. Semua akses game yang kamu miliki tersimpan aman di sini.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="w-full md:w-96 relative group">
            <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari koleksimu..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition-all text-sm text-white shadow-inner backdrop-blur-md placeholder:text-gray-600" />
          </motion.div>
        </header>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {filteredLibrary.length === 0 ? (
            <motion.div variants={itemVariants} className="col-span-full text-center py-32 bg-white/[0.02] border border-white/5 rounded-[2rem] backdrop-blur-md">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                <FaBoxOpen className="w-10 h-10 text-purple-400" />
              </div>
              <p className="text-white text-2xl font-black uppercase tracking-tight mb-2">
                {library.length === 0 ? 'Vault Masih Kosong' : 'Game Tidak Ditemukan'}
              </p>
              <p className="text-gray-400 text-sm mb-8">
                {library.length === 0 ? 'Mulai eksplorasi dan tambahkan game favoritmu sekarang.' : `Tidak ada game dengan kata kunci "${search}"`}
              </p>
              {library.length === 0 ? (
                <button onClick={() => navigate('/store')}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all">
                  Jelajahi Store
                </button>
              ) : (
                <button onClick={() => setSearch('')}
                  className="px-8 py-4 bg-white/10 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white/20 transition-all">
                  Hapus Pencarian
                </button>
              )}
            </motion.div>
          ) : (
            filteredLibrary.map(item => {
              const g = item.games
              if (!g) return null
              return (
                <motion.div key={item.id} variants={itemVariants} 
                  className="bg-white/[0.02] border border-white/[0.05] rounded-[1.5rem] overflow-hidden group hover:border-purple-500/30 transition-all hover:bg-white/[0.04] shadow-lg hover:shadow-purple-500/10 flex flex-col"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img src={g.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" alt={g.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-lg ${
                      g.connectivity_type === 'Online'
                        ? 'bg-blue-500/20 border-blue-400/30 text-blue-300'
                        : 'bg-green-500/20 border-green-400/30 text-green-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${g.connectivity_type === 'Online' ? 'bg-blue-400' : 'bg-green-400'} animate-pulse`} />
                      {g.connectivity_type || 'Offline'}
                    </div>
                  </div>
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black text-fuchsia-400 uppercase tracking-[0.2em]">{g.genre}</span>
                      <h3 className="text-lg font-black uppercase tracking-tight mt-1 text-white line-clamp-2">{g.title}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <button onClick={() => openVault(g.id)} className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all">
                        <FaLockOpen /> Buka
                      </button>
                      <button onClick={() => openVault(g.id, true)} className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                        <FaBook /> Info
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      </main>

      {/* Vault Modal */}
      <AnimatePresence>
        {vaultOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setVaultOpen(false)} />
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#0a0a0a]/90 border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col"
            >
              {/* Modal Glow */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
              
              <button onClick={() => setVaultOpen(false)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                <FaTimes />
              </button>

              <div className="text-center mb-10 mt-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-4 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                  <FaLockOpen size={28} />
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-2">{vaultGame}</h2>
                <p className="text-xs text-gray-400 uppercase tracking-widest">Vault Unsealed</p>
              </div>

              <div className="space-y-8 flex-grow">
                {/* Cloud Access */}
                <section>
                  <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <FaDownload /> Cloud Files
                  </h4>
                  <div className="space-y-3">
                    {vaultLinks.length > 0 ? vaultLinks.map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-purple-500/30 hover:bg-white/[0.06] transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-300">
                            {link.icon === 'tool' ? <FaCog /> : link.icon === 'guide' ? <FaBook /> : <FaBoxOpen />}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-200">{link.label}</span>
                        </div>
                        <span className="text-[10px] font-black text-purple-400 group-hover:text-white transition-colors">Unduh &rarr;</span>
                      </a>
                    )) : (
                      <div className="p-4 bg-white/5 rounded-2xl text-center text-gray-500 text-xs">File tidak tersedia.</div>
                    )}
                    
                    {voraLink && (
                      <div className="pt-4 border-t border-white/5 space-y-3">
                        <button onClick={handleAutoInstall}
                          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl hover:from-purple-600/30 hover:to-indigo-600/30 transition-all group overflow-hidden relative">
                          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.05]" />
                          <div className="relative z-10 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg">
                              <FaRocket />
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-xs font-bold uppercase tracking-widest text-white">VoraTools Auto Install</span>
                              <span className="text-[9px] text-purple-300 uppercase tracking-widest mt-1">1-Click Steam Integration</span>
                            </div>
                          </div>
                          <span className="relative z-10 text-[10px] font-black text-purple-300 group-hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-lg">Mulai &rarr;</span>
                        </button>
                        <p className="text-center">
                          <a href="/GVREngine_Setup.bat" download className="text-[10px] text-gray-500 hover:text-purple-400 transition-colors border-b border-gray-600 hover:border-purple-400 pb-0.5">
                            Belum install Engine? Unduh Setup di sini.
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Guide Section */}
                <section id="guide-section">
                  <h4 className="text-[10px] font-black text-fuchsia-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <FaBook /> Petunjuk Instalasi
                  </h4>
                  <div className="p-5 md:p-6 bg-white/[0.02] rounded-2xl border border-white/[0.05] text-[13px] text-gray-300 leading-relaxed font-medium whitespace-pre-wrap shadow-inner">
                    {vaultGuide}
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Installer Overlay */}
      <AnimatePresence>
        {isInstalling && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-lg text-center flex flex-col items-center bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
              {installStep < 3 ? (
                <>
                  <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-[3px] border-purple-500/20 rounded-full animate-ping" />
                    <div className="absolute inset-0 border-[4px] border-t-purple-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-3xl text-purple-400">
                      <FaRocket />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-white">System Integration</h2>
                  <p className="text-xs text-purple-400 font-black uppercase tracking-widest mb-8 animate-pulse">
                    {installStep === 0 ? 'Menginisialisasi VoraTools...' : installStep === 1 ? 'Membangun koneksi lokal...' : 'Sinkronisasi Library Steam...'}
                  </p>
                  
                  <div className="w-full space-y-3 text-left">
                    <div className="bg-white/5 px-5 py-4 rounded-xl text-[10px] font-bold text-gray-300 border border-white/10 flex gap-3">
                      <span className="text-purple-400">01</span> Izinkan browser membuka protokol.
                    </div>
                    <div className="bg-white/5 px-5 py-4 rounded-xl text-[10px] font-bold text-gray-300 border border-white/10 flex gap-3">
                      <span className="text-indigo-400">02</span> Proses berjalan gaib di latar belakang.
                    </div>
                  </div>
                </>
              ) : (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border-4 border-green-500/30 mb-6 shadow-[0_0_40px_rgba(34,197,94,0.2)] text-green-400 text-4xl">
                    <FaCheckCircle />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight mb-3 text-white">Instalasi Selesai</h2>
                  <p className="text-xs text-gray-400 leading-relaxed mb-8">
                    Game berhasil di-inject ke dalam Steam Library kamu. Buka aplikasi Steam untuk memainkannya.
                  </p>
                </motion.div>
              )}

              <button onClick={() => setIsInstalling(false)}
                className="mt-8 px-10 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all text-white w-full border border-white/10">
                Tutup Layar Ini
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Engine Warning */}
      <AnimatePresence>
        {showEngineWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 text-center shadow-2xl">
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 text-3xl mx-auto mb-6 border border-purple-500/20">
                <FaCog />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-3 text-white">GVR Engine Dibutuhkan</h2>
              <p className="text-xs text-gray-400 leading-relaxed mb-8">
                Untuk menggunakan fitur 1-Click Install yang instan dan gaib, kamu harus menginstal GVR Engine terlebih dahulu di PC kamu (cukup 1x seumur hidup).
              </p>
              <div className="space-y-3">
                <a href="/GVREngine_Setup.bat" download onClick={() => localStorage.setItem('gvr_engine_installed', 'true')}
                  className="block w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-purple-500/30">
                  Unduh & Pasang Engine
                </a>
                <button onClick={proceedToInstall}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                  Saya Sudah Memasangnya
                </button>
              </div>
              <button onClick={() => setShowEngineWarning(false)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                <FaTimes />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}
