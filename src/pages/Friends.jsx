import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useFriends } from '../contexts/FriendsContext'
import { useToast } from '../contexts/ToastContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ConfirmModal from '../components/ConfirmModal'
import { Helmet } from 'react-helmet-async'

export default function Friends() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { friends, pendingRequests, sendRequest, respondToRequest, removeFriend } = useFriends()
  const [tab, setTab] = useState('friends')
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(null)
  const [confirmReject, setConfirmReject] = useState(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
  }, [user])

  useEffect(() => {
    if (search.trim().length < 2) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase.from('profiles')
        .select('id, full_name, username, avatar_url')
        .or(`full_name.ilike.%${search}%,username.ilike.%${search}%`)
        .neq('id', user.id)
        .limit(10)
      setSearchResults(data || [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, user])

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>GVR - Agent Network</title></Helmet>
      
      {/* Background Cyber Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[150px] animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-cyan-500/[0.05]" />
      </div>

      <Navbar />
      
      <main className="max-w-4xl mx-auto pt-32 px-4 md:px-6 pb-24 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-14 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/80 border border-white/5 backdrop-blur-md shadow-lg shadow-black/50 mb-6 cursor-pointer" onClick={() => navigate('/profile')}>
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span className="text-cyan-300 text-[10px] font-black uppercase tracking-[0.4em]">Back to Hub</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-4 relative flex items-center justify-center gap-4">
            <span className="text-white drop-shadow-lg">Agent</span>{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                Network
              </span>
              <span className="absolute inset-x-0 bottom-1 h-3 bg-cyan-500/20 blur-md -z-10" />
            </span>
          </h1>
          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-[0.3em] max-w-lg mx-auto">
            Manage your synchronized connections and allied operatives.
          </p>
        </div>

        {/* Cyber Segmented Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {[
            { key: 'friends', label: 'Active Connections', count: friends.length },
            { key: 'requests', label: 'Incoming Signals', count: pendingRequests.length },
            { key: 'search', label: 'Scan Database' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 overflow-hidden group ${
                tab === t.key
                  ? 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                  : 'bg-zinc-900/60 border border-white/10 text-gray-500 hover:text-white hover:border-cyan-500/30'
              }`}>
              {tab === t.key && <div className="absolute inset-x-0 bottom-0 h-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]" />}
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <span className="relative z-10">{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className={`relative z-10 flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[8px] border transition-colors ${tab === t.key ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200' : 'bg-white/5 border-white/10'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* View: Scan Database */}
        {tab === 'search' && (
          <div className="space-y-6 max-w-2xl mx-auto animate-fade-up">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500 pointer-events-none"></div>
              <div className="relative flex items-center bg-zinc-900/90 border border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden shadow-2xl px-2">
                <div className="pl-4 pr-2">
                  <svg className={`w-5 h-5 transition-colors duration-300 ${searching ? 'text-cyan-400 animate-spin' : 'text-gray-500 group-focus-within:text-cyan-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {searching ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    )}
                  </svg>
                </div>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Scan global database for usernames or IDs..."
                  className="w-full bg-transparent py-5 px-2 outline-none text-sm font-bold text-white placeholder:text-gray-600 tracking-wide" />
              </div>
            </div>
            
            <div className="space-y-3">
              {searchResults.map((p, i) => (
                <div key={p.id} className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-[24px] p-4 hover:border-cyan-500/30 transition-all duration-300 animate-fade-up group" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-600 to-purple-600 flex-shrink-0 border-2 border-white/10 group-hover:border-cyan-400/50 transition-colors relative z-10">
                      {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-black text-white">
                          {(p.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <p className="text-base font-black uppercase truncate text-white">{p.full_name || 'Unknown Agent'}</p>
                    {p.username && <p className="text-[10px] text-gray-500 font-mono mt-1">ID: <span className="text-cyan-400">@{p.username}</span></p>}
                  </div>
                  <button onClick={async () => {
                    const { error } = await sendRequest(p.id)
                    if (error) showToast(error.message, 'error')
                    else { showToast('Signal sent!', 'success'); setSearch(''); setSearchResults([]) }
                  }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] active:scale-95 transition-all">
                    Send Signal
                  </button>
                </div>
              ))}
              
              {search.trim().length >= 2 && !searching && searchResults.length === 0 && (
                <div className="text-center py-16 bg-black/20 border border-white/5 rounded-[32px] backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 border border-dashed border-gray-600 rounded-full animate-spin-slow" />
                    <div className="absolute inset-2 border border-gray-700 rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                  </div>
                  <p className="text-lg font-black uppercase tracking-widest text-white mb-2">No Match Found</p>
                  <p className="text-xs text-gray-500 font-medium">Database tidak mendeteksi operatif dengan ID "{search}".</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View: Active Connections */}
        {tab === 'friends' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up">
            {friends.length > 0 ? friends.map((f, i) => (
              <div key={f.id} className="group flex items-center justify-between gap-4 bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-[24px] p-4 hover:border-cyan-500/30 hover:bg-zinc-800/80 transition-all duration-300" style={{ animationDelay: `${i * 0.05}s` }}>
                <Link to={`/profile?user=${f.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-600 to-purple-600 flex-shrink-0 border-2 border-white/10 group-hover:border-cyan-400/50 transition-colors">
                      {f.avatar_url ? <img src={f.avatar_url} className="w-full h-full object-cover" /> : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-black text-white">
                          {(f.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                    </div>
                    {/* Status Dot */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-900 rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)] animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black uppercase truncate text-white group-hover:text-cyan-300 transition-colors">{f.full_name || 'Unknown Agent'}</p>
                    {f.username && <p className="text-[9px] text-gray-500 font-mono mt-1">@{f.username}</p>}
                  </div>
                </Link>
                <button onClick={() => setConfirmRemove(f)}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all opacity-0 group-hover:opacity-100 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )) : (
              <div className="col-span-full text-center py-20 bg-black/20 border border-white/5 rounded-[32px] backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-cyan-500/5 border border-cyan-500/10 animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-4 rounded-full bg-cyan-500/10 border border-cyan-500/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-10 h-10 text-cyan-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </div>
                <p className="text-xl font-black uppercase tracking-widest text-white mb-2 drop-shadow-md">No Active Connections</p>
                <p className="text-xs text-gray-400 font-medium max-w-sm mx-auto mb-8">Jaringan kamu masih kosong. Lakukan *Scan Database* untuk mencari agen lain dan mulai terhubung.</p>
                <button onClick={() => setTab('search')}
                  className="px-8 py-3.5 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all">
                  Scan Database 
                </button>
              </div>
            )}
          </div>
        )}

        {/* View: Incoming Signals (Requests) */}
        {tab === 'requests' && (
          <div className="space-y-3 max-w-2xl mx-auto animate-fade-up">
            {pendingRequests.length > 0 ? pendingRequests.map((r, i) => (
              <div key={r.id} className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-[24px] p-4 hover:border-purple-500/30 transition-all duration-300" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-yellow-500/20 blur-md animate-pulse" />
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-600 to-red-600 flex-shrink-0 border-2 border-yellow-500/30 relative z-10">
                    {r.avatar_url ? <img src={r.avatar_url} className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-black text-white">
                        {(r.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <p className="text-base font-black uppercase truncate text-white">{r.full_name || 'Unknown Signal'}</p>
                  {r.username && <p className="text-[10px] text-yellow-400 font-mono mt-1">Incoming from: @{r.username}</p>}
                </div>
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <button onClick={async () => {
                    const { error } = await respondToRequest(r.requestId, true)
                    if (!error) showToast('Connection established!', 'success')
                  }}
                    className="flex-1 sm:flex-none px-6 py-3.5 bg-green-500/10 border border-green-500/30 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-green-400 hover:bg-green-500/20 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] active:scale-95 transition-all">
                    Accept
                  </button>
                  <button onClick={() => setConfirmReject(r)}
                    className="flex-1 sm:flex-none px-6 py-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-95 transition-all">
                    Reject
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-20 bg-black/20 border border-white/5 rounded-[32px] backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 border border-dashed border-gray-600 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </div>
                </div>
                <p className="text-xl font-black uppercase tracking-widest text-white mb-2">No Incoming Signals</p>
                <p className="text-xs text-gray-500 font-medium">Radar bersih. Belum ada operatif yang mencoba mengirim permintaan koneksi.</p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <Footer />

      {/* Confirmation Modals */}
      {confirmRemove && (
        <ConfirmModal
          title="Sever Connection"
          message={`Are you sure you want to disconnect from ${confirmRemove.full_name || 'this agent'}? They will be removed from your active network.`}
          confirmLabel="Disconnect"
          variant="danger"
          onConfirm={async () => {
            const { error } = await removeFriend(confirmRemove.friendshipId)
            if (!error) showToast('Connection severed', 'info')
            setConfirmRemove(null)
          }}
          onClose={() => setConfirmRemove(null)}
        />
      )}

      {confirmReject && (
        <ConfirmModal
          title="Block Signal"
          message={`Tolak permintaan sinyal dari ${confirmReject.full_name || 'agen ini'}?`}
          confirmLabel="Block"
          variant="danger"
          onConfirm={async () => {
            await respondToRequest(confirmReject.requestId, false)
            setConfirmReject(null)
          }}
          onClose={() => setConfirmReject(null)}
        />
      )}
    </div>
  )
}
