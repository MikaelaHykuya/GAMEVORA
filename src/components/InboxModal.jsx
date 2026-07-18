import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function InboxModal({ open, onClose }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const openRef = useRef(open)
  openRef.current = open

  const fetchNotifs = async () => {
    if (!user) return
    const { data } = await supabase
      .from('vault_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setNotifications(data || [])
    
    // Auto mark as read when fetched
    await supabase.from('vault_notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
  }

  useEffect(() => {
    if (!user) return
    const id = Math.random().toString(36).slice(2, 8)
    const channel = supabase.channel('inbox_' + user.id + '_' + id)
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vault_notifications', filter: 'user_id=eq.' + user.id }, () => {
      if (openRef.current) fetchNotifs()
    })
    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  useEffect(() => {
    if (!open || !user) return
    setLoading(true)
    fetchNotifs().finally(() => setLoading(false))
  }, [open, user])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Modal Backdrop with Terminal Grid Pattern */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-px bg-cyan-500/10 blur-[2px]" />
      </div>
      
      {/* Modal Container */}
      <div className="relative bg-zinc-950/80 border border-cyan-500/30 p-8 rounded-[32px] max-w-lg w-full max-h-[85vh] flex flex-col shadow-[0_0_50px_rgba(34,211,238,0.15)] backdrop-blur-2xl animate-fade-up">
        
        {/* Decorative corner glows */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-[60px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-600/20 rounded-full blur-[70px] pointer-events-none -z-10" />
        
        {/* Header Section */}
        <div className="mb-6 relative pb-4 border-b border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-cyan-400 text-[9px] font-mono uppercase tracking-[0.3em]">Secure Comms Link Active</span>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Transmission Log</span>
          </h3>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto space-y-4 no-scrollbar min-h-[350px] pr-2">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-2 border-dashed border-cyan-500/30 rounded-full animate-spin-slow" />
                <div className="absolute inset-2 border-2 border-purple-500/40 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
              </div>
              <p className="text-[10px] text-cyan-400 font-mono uppercase tracking-[0.2em] animate-pulse">Decrypting Signals...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center bg-black/20 rounded-3xl border border-white/5 relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none mix-blend-overlay" />
              <div className="w-20 h-20 rounded-full bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping" style={{ animationDuration: '3s' }} />
                <svg className="w-8 h-8 text-cyan-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-sm font-black uppercase tracking-[0.1em] text-white mb-2">No Incoming Transmissions</p>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest max-w-[200px] mx-auto">Radar clear. You are caught up.</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <div
                key={n.id}
                className={`group relative p-5 rounded-[20px] transition-all duration-300 animate-fade-up ${
                  n.is_read 
                    ? 'bg-zinc-900/50 border border-white/5 opacity-70 hover:opacity-100 hover:bg-zinc-900/80' 
                    : 'bg-cyan-500/[0.03] border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {!n.is_read && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 rounded-l-[20px] animate-pulse shadow-[0_0_10px_rgba(34,211,238,1)]" />
                )}
                
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    n.is_read ? 'bg-zinc-800 border-white/10 text-gray-500' : 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-black uppercase tracking-tight mb-1 truncate ${n.is_read ? 'text-gray-300' : 'text-cyan-300'}`}>
                      {n.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium mb-3">{n.message}</p>
                    <span className="text-[8px] text-gray-600 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Button */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <button 
            onClick={onClose} 
            className="w-full py-4 bg-zinc-900 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all duration-300 active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover:animate-shimmer" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              Close Link
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
