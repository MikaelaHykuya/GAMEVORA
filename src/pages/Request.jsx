import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Helmet } from 'react-helmet-async'
import { useToast } from '../contexts/ToastContext'

export default function Request() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [gameTitle, setGameTitle] = useState('')
  const [platform, setPlatform] = useState('PC')
  const [notes, setNotes] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  const [myRequests, setMyRequests] = useState([])

  const fetchMyRequests = async () => {
    if (!user) return
    const { data } = await supabase.from('game_requests').select('*').eq('user_email', user.email).order('created_at', { ascending: false })
    if (data) setMyRequests(data)
  }

  useEffect(() => {
    fetchMyRequests()

    if (user) {
      const channel = supabase.channel('user_requests')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_requests', filter: `user_email=eq.${user.email}` }, () => {
          fetchMyRequests()
        })
        .subscribe()
        return () => supabase.removeChannel(channel)
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    setLoading(true)
    const { error } = await supabase.from('game_requests').insert([{
      user_email: user.email,
      game_title: gameTitle,
      platform,
      notes,
      status: 'pending',
    }])
    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      setSent(true)
      
      // Notify Admins
      const sender = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
      supabase.functions.invoke('send-push', { 
        body: { 
          title: `Game Request Baru 🎮`, 
          message: `${sender} merequest game: ${gameTitle}. Cek dashboard admin!`, 
          is_admin: true 
        } 
      }).catch(console.error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>GVR - Request Game</title><meta name="description" content="Request a game to be added to GameVora" /></Helmet>
      {/* Cyber Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-white/[0.02]" />
      </div>

      <Navbar />
      
      <main className="max-w-4xl mx-auto pt-32 px-4 md:px-6 pb-20 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/80 border border-white/5 backdrop-blur-md shadow-lg shadow-black/50 mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
            <span className="text-purple-300 text-[10px] font-black uppercase tracking-[0.4em]">Signal Relay Active</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 relative">
            <span className="text-white drop-shadow-lg">Game</span>{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                Request
              </span>
              <span className="absolute inset-x-0 bottom-2 h-4 bg-purple-500/20 blur-md -z-10" />
            </span>
          </h1>
          
          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed">
            Kirimkan sinyal permintaan game atau software yang belum ada di Vault. Tim admin kami akan segera merespons transmisi ini.
          </p>
        </div>

        {sent ? (
          <div className="bg-zinc-900/60 backdrop-blur-2xl border border-green-500/30 rounded-[32px] p-12 text-center max-w-lg mx-auto relative overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent pointer-events-none" />
            
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-green-500/30 blur-md" />
              <div className="relative w-full h-full bg-zinc-900 border-2 border-green-400 rounded-full flex items-center justify-center z-10 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-2xl font-black uppercase tracking-widest mb-3 text-white drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]">
              Signal Transmitted!
            </h3>
            <p className="text-gray-400 text-sm font-medium leading-relaxed">
              Request berhasil masuk ke jaringan admin. Sinyal ini akan diproses secepat mungkin. Periksa status di log transmisi.
            </p>
            
            <button onClick={() => setSent(false)} className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-green-400 hover:text-white transition-colors bg-green-500/10 px-6 py-2.5 rounded-xl border border-green-500/20 hover:bg-green-500/30">
              Kirim Sinyal Baru
            </button>
          </div>
        ) : (
          <div className="relative group max-w-xl mx-auto">
            {/* Glow backing */}
            <div className="absolute -inset-1 bg-gradient-to-b from-purple-600/30 to-cyan-600/30 rounded-[32px] blur opacity-40 group-hover:opacity-70 transition duration-1000 pointer-events-none" />
            
            <div className="relative bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 md:p-10 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase text-purple-300 tracking-[0.2em]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    Judul Game / Software
                  </label>
                  <input type="text" value={gameTitle} onChange={e => setGameTitle(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-purple-500/60 focus:bg-purple-900/10 focus:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all text-sm font-bold text-white placeholder:text-gray-600"
                    placeholder="Masukkan judul..." required />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase text-purple-300 tracking-[0.2em]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Platform Tujuan
                  </label>
                  <div className="relative">
                    <select value={platform} onChange={e => setPlatform(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-purple-500/60 focus:bg-purple-900/10 focus:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all text-sm font-bold text-white cursor-pointer appearance-none">
                      {['PC', 'Android', 'PlayStation', 'Xbox', 'Nintendo Switch', 'macOS', 'Linux'].map(p => (
                        <option key={p} value={p} className="bg-zinc-900 text-white font-medium">{p}</option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase text-purple-300 tracking-[0.2em]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Catatan Tambahan
                  </label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="4"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-purple-500/60 focus:bg-purple-900/10 focus:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all text-sm font-medium text-gray-300 placeholder:text-gray-600 resize-none custom-scrollbar"
                    placeholder="Contoh: Tolong cari versi Ultimate Edition..." />
                </div>
                
                <div className="pt-2">
                  <button type="submit" disabled={loading}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-4.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300 disabled:opacity-50 active:scale-[0.98] group/btn">
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:animate-shimmer" />
                    {loading ? (
                      <span className="flex items-center justify-center gap-3 relative z-10">
                        <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        TRANSMITTING...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 relative z-10">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        Send Signal
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {myRequests.length > 0 && (
          <div className="mt-20 max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                Transmission Logs
              </h3>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
            </div>
            
            <div className="space-y-3">
              {myRequests.map((req, i) => (
                <div key={req.id} className="group bg-zinc-900/40 backdrop-blur-md border border-white/[0.04] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-purple-500/30 hover:bg-zinc-800/60 transition-all duration-300 animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="min-w-0 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-purple-500/40 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all">
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <div>
                      <p className="text-base font-black uppercase truncate text-white group-hover:text-purple-300 transition-colors">{req.game_title}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-1">Platform: <span className="text-gray-300">{req.platform}</span></p>
                    </div>
                  </div>
                  
                  <div className="shrink-0 md:text-right">
                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                      req.status === 'fullverified' ? 'text-green-400 border-green-500/30 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]' :
                      req.status === 'proses' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_10px_rgba(34,211,238,0.2)]' :
                      req.status === 'rejected' ? 'text-red-400 border-red-500/30 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                      'text-yellow-400 border-yellow-500/30 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                    }`}>
                      {req.status === 'fullverified' ? (
                        <><span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> TERSEDIA</>
                      ) : req.status === 'proses' ? (
                        <><span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" /> DIPROSES</>
                      ) : req.status === 'rejected' ? (
                        <><span className="w-1.5 h-1.5 bg-red-400 rounded-full" /> DITOLAK</>
                      ) : (
                        <><span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" /> PENDING</>
                      )}
                    </span>
                    <p className="text-[9px] text-gray-600 font-mono mt-2 md:mt-1">
                      {new Date(req.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
