import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'

export default function MaintenancePage({ message, user }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center relative overflow-hidden px-6">
      <Helmet><title>GAMEVORA - Maintenance</title><meta name="description" content="GameVora is under maintenance" /></Helmet>
      
      {/* Premium Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden mix-blend-screen">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 text-center max-w-2xl w-full">
        {/* Animated Icon */}
        <div className="w-28 h-28 mx-auto mb-10 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-purple-500/20 to-pink-500/20 rounded-[2rem] blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse" />
          <div className="relative w-full h-full bg-[#0A0A0C]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-black overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
            <svg className="w-12 h-12 text-yellow-500 animate-spin-slow relative z-10 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-8 shadow-[0_0_20px_rgba(234,179,8,0.1)] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 drop-shadow-md">System Maintenance</span>
        </div>

        {/* Typography */}
        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-6 leading-tight">
          We'll Be
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-500 drop-shadow-2xl">
            Right Back
          </span>
        </h1>

        <p className="text-gray-400 font-bold uppercase tracking-[0.15em] text-xs leading-loose mb-10 max-w-lg mx-auto">
          {message || 'Kami sedang melakukan peningkatan sistem untuk memberikan pengalaman terbaik. Harap bersabar, ya!'}
        </p>

        {/* Status Card */}
        <div className="bg-[#0A0A0C]/80 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/[0.08] mb-10 mx-auto max-w-md shadow-2xl shadow-black relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
          <div className="relative z-10 flex items-center justify-around text-[10px] font-black uppercase tracking-[0.2em]">
            <div className="text-center">
              <p className="text-gray-500 mb-2">Status</p>
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-yellow-400">Upgrading</span>
              </div>
            </div>
            <div className="w-px h-12 bg-white/[0.08]" />
            <div className="text-center">
              <p className="text-gray-500 mb-2">Server Time</p>
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300">
                {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta' })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          {!user ? (
            <a href="/login" className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] active-scale transition-all hover:shadow-lg hover:shadow-white/5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login Admin
            </a>
          ) : (
            <button onClick={async () => {
              const { supabase } = await import('@lib/supabase')
              await supabase.auth.signOut()
              window.location.href = '/'
            }} className="flex items-center gap-3 px-8 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] active-scale transition-all hover:shadow-lg hover:shadow-red-500/10">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          )}
          <a href="mailto:support@gamevora.com" className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 border border-purple-400/50 rounded-2xl text-[10px] text-white font-black uppercase tracking-[0.15em] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] active-scale transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Hubungi Admin
          </a>
        </div>
      </div>

      <p className="absolute bottom-8 text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">
        &copy; {new Date().getFullYear()} GameVora
      </p>
    </div>
  )
}
