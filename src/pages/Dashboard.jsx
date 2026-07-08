import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { GameCardSkeleton } from '../components/Skeleton'
import { Helmet } from 'react-helmet-async'

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
          .eq('status', 'approved')
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
      }, 100)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <Navbar />
        <main className="pt-32 px-6 max-w-7xl mx-auto pb-8">
          <div className="mb-10">
            <div className="w-32 h-3 bg-zinc-800 rounded-full skeleton mb-4" />
            <div className="w-64 h-8 bg-zinc-800 rounded-xl skeleton mb-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Helmet><title>GVR - Vault</title><meta name="description" content="Your game vault - access your purchased games" /></Helmet>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] bg-blue-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <Navbar />
      <main className="pt-32 px-6 max-w-7xl mx-auto pb-8 relative">
        <header className="mb-10">
          <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] block mb-2">Authenticated Access</span>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">The Vault</h1>
          <div className="flex gap-2 mb-6">
            <div className="w-16 h-1.5 bg-purple-600 rounded-full" />
            <div className="w-4 h-1.5 bg-blue-500 rounded-full" />
          </div>
          <p className="text-gray-400 text-sm max-w-md leading-relaxed">
            Akses semua produk digital yang telah kamu buka di sini.
          </p>
        </header>

        <div className="mb-10 relative max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari game di vault..."
            className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl pl-11 pr-5 py-3.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLibrary.length === 0 ? (
            <div className="col-span-full text-center py-24">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-2xl bg-purple-500/5 border border-purple-500/10 animate-pulse" />
                <div className="absolute inset-3 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-300 text-lg font-black uppercase tracking-tight">
                {library.length === 0 ? 'Vault Kosong' : 'Tidak Ditemukan'}
              </p>
              <p className="text-gray-600 text-xs font-bold mt-2">
                {library.length === 0 ? 'Belum ada game yang kamu miliki. Kunjungi Store untuk membeli!' : `Tidak ada hasil untuk "${search}"`}
              </p>
              {library.length === 0 ? (
                <button onClick={() => navigate('/store')}
                  className="mt-6 px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-2xl text-[9px] font-black uppercase tracking-widest text-purple-300 hover:bg-purple-500/30 transition-all">
                  Kunjungi Store →
                </button>
              ) : (
                <button onClick={() => setSearch('')}
                  className="mt-6 px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-2xl text-[9px] font-black uppercase tracking-widest text-purple-300 hover:bg-purple-500/30 transition-all">
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            filteredLibrary.map(item => {
              const g = item.games
              if (!g) return null
              return (
                <div key={item.id} className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl overflow-hidden group hover:border-white/[0.08] transition-all">
                  <div className="aspect-video overflow-hidden relative">
                    <img src={g.thumbnail} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" alt={g.title} />
                    <div className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg text-[6px] font-black uppercase tracking-wider border backdrop-blur-sm ${
                      g.connectivity_type === 'Online'
                        ? 'bg-blue-600/70 border-blue-400/20 text-blue-200'
                        : 'bg-green-600/70 border-green-400/20 text-green-200'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${g.connectivity_type === 'Online' ? 'bg-blue-400' : 'bg-green-400'} animate-pulse`} />
                      {g.connectivity_type || 'Offline'}
                    </div>
                  </div>
                  <div className="p-5">
                    <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest">{g.genre}</span>
                    <h3 className="text-lg font-black uppercase tracking-tight mt-1">{g.title}</h3>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button onClick={() => openVault(g.id)} className="bg-gradient-to-r from-purple-600 to-purple-500 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300">
                        Access Files
                      </button>
                      <button onClick={() => openVault(g.id, true)} className="bg-white/[0.03] border border-white/[0.06] text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-white/10 transition-all">
                        Tutorial
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {vaultOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setVaultOpen(false)} />
          <div className="relative bg-zinc-900/95 border border-white/[0.06] rounded-3xl p-6 md:p-8 max-w-xl w-full animate-fade-in max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">{vaultGame}</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-4">Cloud Access:</h4>
                <div className="space-y-2.5">
                  {vaultLinks.length > 0 ? vaultLinks.map((link, i) => {
                    const iconMap = { box: '📦', tool: '🔧', guide: '📖', fix: '🛠️' }
                    return (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-zinc-900/60 border border-white/[0.06] rounded-2xl hover:border-purple-500/30 transition-all group">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{iconMap[link.icon] || '🔗'}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest">{link.label}</span>
                        </div>
                        <span className="text-[9px] font-black text-purple-400 group-hover:text-white transition-colors">DOWNLOAD →</span>
                      </a>
                    )
                  }) : <p className="text-[9px] text-gray-600 uppercase">No links provided.</p>}
                  
                  {voraLink && (
                    <div className="flex flex-col gap-3">
                      <button onClick={handleAutoInstall}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/30 rounded-2xl hover:from-purple-600/20 hover:to-blue-600/20 transition-all group">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">⚡</span>
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">VoraTools Auto Install</span>
                            <span className="text-[7px] text-purple-400 uppercase tracking-widest">1-Click Install</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-purple-400 group-hover:text-white transition-colors">START →</span>
                      </button>
                      <a href="/GVREngine_Setup.bat" download
                        className="text-[9px] text-center text-gray-500 hover:text-purple-400 underline decoration-purple-500/30 underline-offset-4 transition-colors">
                        Belum pasang GVR Engine? Download Setup (1x Install)
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div id="guide-section">
                <h4 className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mb-4">Installation Guide:</h4>
                <div className="p-5 bg-zinc-900/60 rounded-2xl border border-white/[0.04] text-[11px] text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">
                  {vaultGuide}
                </div>
              </div>
            </div>
            <button onClick={() => setVaultOpen(false)}
              className="w-full mt-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300">
              Seal Vault
            </button>
          </div>
        </div>
      )}

      {isInstalling && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
          <div className="relative w-full max-w-2xl animate-fade-in text-center flex flex-col items-center">
            {installStep < 3 ? (
              <>
                <div className="relative w-28 h-28 mb-8">
                  <div className="absolute inset-0 border-4 border-purple-600/30 rounded-full animate-[spin_3s_linear_infinite]" />
                  <div className="absolute inset-2 border-4 border-t-purple-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-[spin_1.5s_ease-in-out_infinite]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl">⚡</span>
                  </div>
                </div>
                
                <h2 className="text-3xl font-black uppercase tracking-tight mb-4 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">System Integration</h2>
                <div className="flex flex-col gap-2 mb-8 items-center">
                  <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.3em] mb-4 animate-pulse">
                    {installStep === 0 ? 'Mengirim Protokol GVR...' : installStep === 1 ? 'Menunggu engine lokal...' : 'Mengintegrasikan dengan Steam Library...'}
                  </p>
                  <div className="bg-purple-600/20 text-purple-300 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-purple-500/30">
                    1. Klik "Open" jika browser meminta izin.
                  </div>
                  <div className="bg-blue-600/20 text-blue-300 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-blue-500/30">
                    2. Proses akan berjalan otomatis di latar belakang secara gaib.
                  </div>
                </div>
              </>
            ) : (
              <div className="animate-bounce-in flex flex-col items-center">
                <div className="w-28 h-28 bg-green-500/15 rounded-full flex items-center justify-center border-4 border-green-500/30 mb-8 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                  <span className="text-5xl">✅</span>
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight mb-4 text-green-400 drop-shadow-lg">INSTALLATION SUCCESS</h2>
                <p className="text-[11px] text-gray-300 font-bold uppercase tracking-widest leading-relaxed mb-6 max-w-md">
                  Proses integrasi telah selesai! Game sudah berhasil ditambahkan ke dalam Steam Library kamu. Silakan buka Steam untuk mulai bermain.
                </p>
              </div>
            )}

            <button onClick={() => setIsInstalling(false)}
              className="mt-6 px-10 py-4 bg-white/[0.03] border border-white/[0.06] hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
              Tutup Layar Ini
            </button>
          </div>
        </div>
      )}

      {showEngineWarning && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
          <div className="relative w-full max-w-md bg-zinc-900/95 border border-white/[0.06] rounded-3xl p-8 text-center animate-fade-in">
            <div className="w-16 h-16 bg-purple-600/15 rounded-2xl flex items-center justify-center border border-purple-500/30 mx-auto mb-5">
              <span className="text-3xl">⚙️</span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-4 text-white">GVR Engine Dibutuhkan</h2>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8">
              Untuk menggunakan fitur 1-Click Install yang instan dan gaib, kamu harus menginstal GVR Engine terlebih dahulu (cukup 1x seumur hidup).
            </p>
            <div className="flex flex-col gap-3">
              <a href="/GVREngine_Setup.bat" download onClick={() => localStorage.setItem('gvr_engine_installed', 'true')}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:shadow-lg hover:shadow-purple-600/20 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all">
                Download & Install Engine
              </a>
              <button onClick={proceedToInstall}
                className="w-full py-4 bg-white/[0.03] hover:bg-white/10 border border-white/[0.06] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all">
                Saya Sudah Menginstalnya
              </button>
            </div>
            <button onClick={() => setShowEngineWarning(false)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
