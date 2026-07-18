import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'

export default function MaintenancePage({ message, user }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center relative overflow-hidden px-6">
      <Helmet><title>GVR - Maintenance</title><meta name="description" content="GameVora is under maintenance" /></Helmet>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[150px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-yellow-600/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <div className="relative z-10 text-center max-w-lg">
        <div className="w-24 h-24 mx-auto mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-yellow-600/20 rounded-[32px] blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-white/[0.03] border border-white/[0.08] rounded-[32px] flex items-center justify-center">
            <svg className="w-12 h-12 text-yellow-500 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-6">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
          <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Scheduled Maintenance</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter mb-5">
          We'll Be
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-500">
            Right Back
          </span>
        </h1>

        <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px] leading-loose mb-8">
          {message || 'Kami sedang melakukan peningkatan sistem untuk memberikan pengalaman terbaik. Harap bersabar, ya!'}
        </p>

        <div className="glass-card-premium p-6 rounded-[30px] border border-white/[0.06] mb-8 inline-block mx-auto">
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
            <div className="text-center">
              <p className="text-gray-500 mb-1">Status</p>
              <p className="text-yellow-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                Maintenance
              </p>
            </div>
            <div className="w-px h-8 bg-white/[0.06]" />
            <div className="text-center">
              <p className="text-gray-500 mb-1">Server Time</p>
              <p className="text-white">
                {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta' })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {!user ? (
            <a href="/login" className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest active-scale transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login Admin
            </a>
          ) : (
            <button onClick={async () => {
              const { supabase } = await import('../lib/supabase')
              await supabase.auth.signOut()
              window.location.href = '/'
            }} className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest active-scale transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          )}
          <a href="mailto:support@gamevora.com" className="flex items-center gap-2 px-6 py-3 bg-white/[0.03] border border-white/[0.08] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 active-scale transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Hubungi Admin
          </a>
        </div>
      </div>

      <p className="absolute bottom-8 text-[8px] text-gray-700 font-black uppercase tracking-widest">
        &copy; {new Date().getFullYear()} GameVora
      </p>
    </div>
  )
}
