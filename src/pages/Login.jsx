import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'

export default function Login() {
  const navigate = useNavigate()
  useEffect(() => { document.body.classList.add('auth-page'); return () => document.body.classList.remove('auth-page') }, [])
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        let msg = error.message
        if (error.status === 422 || msg.includes('Email not confirmed') || msg.includes('not confirmed')) {
          msg = 'Email belum dikonfirmasi. Silakan cek inbox kamu atau coba daftar ulang.'
        }
        showToast('Auth Failed: ' + msg, 'error')
        setLoading(false)
      } else {
        sessionStorage.setItem('showWelcome', 'true')
        setLoading(false)
        setTimeout(() => {
          navigate('/')
        }, 1500)
      }
    } catch {
      showToast('Network Error', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <Helmet>
        <title>GVR | Terminal Login</title>
        <meta name="description" content="Secure authentication for your digital Vault." />
      </Helmet>

      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-cyan-500/10 blur-[1px]" />
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-up">
        {/* Terminal Header */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse" />
            <div className="w-16 h-16 bg-zinc-900 border border-cyan-500/50 rounded-2xl flex items-center justify-center relative shadow-[0_0_30px_rgba(34,211,238,0.2)]">
              <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2">
            Secure <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Login</span>
          </h1>
          <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.3em]">
            Authentication Required
          </p>
        </div>

        {/* Cyberpunk Form Card */}
        <div className="relative bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Input */}
            <div className="group relative">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Agent Email
              </label>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500 pointer-events-none" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus
                className="relative w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-cyan-500/50 focus:bg-cyan-950/10 transition-all text-sm font-mono text-white placeholder:text-gray-700 shadow-inner"
                placeholder="operative@network.gvr" required />
            </div>
            
            {/* Password Input */}
            <div className="group relative">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Passcode
                </label>
                <Link to="/forgot-password" className="text-[9px] text-cyan-400 hover:text-cyan-300 hover:underline transition font-bold tracking-widest uppercase">Lost Key?</Link>
              </div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500 pointer-events-none" />
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 pr-12 outline-none focus:border-purple-500/50 focus:bg-purple-950/10 transition-all text-sm font-mono text-white placeholder:text-gray-700 shadow-inner"
                  placeholder="••••••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors focus:outline-none p-1">
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <button type="submit" disabled={loading}
              className="group relative w-full bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-[0.2em] active-scale hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all duration-300 disabled:opacity-50 overflow-hidden mt-4 border border-white/10">
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-shimmer" />
              {loading ? (
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AUTHENTICATING...
                </span>
              ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Initialize Connection
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              New Operative?{' '}
              <Link to="/register" className="text-cyan-400 hover:text-white transition-colors border-b border-cyan-400/30 hover:border-white pb-0.5">Register Here</Link>
            </p>
            <Link to="/store" className="inline-flex items-center gap-1.5 text-[9px] font-black text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-widest group/back">
              <svg className="w-3 h-3 group-hover/back:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Return to Hub
            </Link>
          </div>
        </div>
      </div>

      {/* Biometric Scan Loading Screen */}
      {loading && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-6 bg-black/95 backdrop-blur-3xl overflow-hidden font-mono">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none mix-blend-overlay" />
          
          <div className="relative text-center w-full max-w-2xl z-10 animate-fade-in flex flex-col items-center">
            {/* Fingerprint / Biometric Scanner Graphic */}
            <div className="relative w-40 h-40 mb-12">
              <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-3xl" />
              <div className="absolute inset-0 border-2 border-cyan-400 rounded-3xl animate-pulse shadow-[0_0_30px_rgba(34,211,238,0.5)]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 20%, 0 20%)' }} />
              <div className="absolute inset-0 border-2 border-cyan-400 rounded-3xl animate-pulse shadow-[0_0_30px_rgba(34,211,238,0.5)]" style={{ clipPath: 'polygon(0 80%, 100% 80%, 100% 100%, 0 100%)' }} />
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 text-cyan-500 opacity-80">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
                  <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                  <path d="M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" />
                  <path d="M12 12l-3.5 -3.5" />
                  <path d="M12 12l4.5 3.5" />
                </svg>
              </div>

              {/* Scanning Laser Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_4px_rgba(34,211,238,0.8)] animate-[slideDown_1.5s_ease-in-out_infinite_alternate]" />
              
              {/* Corner brackets */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500" />
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-500" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-500" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500" />
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-[0.3em] text-white uppercase mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] flex items-center gap-4">
              Authenticating
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </span>
            </h1>
            <h2 className="text-sm md:text-base font-bold tracking-[0.5em] text-cyan-400 uppercase mb-8">
              Biometric Scan In Progress
            </h2>
            
            <div className="text-center space-y-2 text-cyan-500/80 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
              <p className="animate-fade-up" style={{ animationDelay: '0s' }}>ANALYZING CREDENTIALS...</p>
              <p className="animate-fade-up" style={{ animationDelay: '0.3s' }}>VERIFYING SECURITY CLEARANCE...</p>
              <p className="animate-fade-up text-white" style={{ animationDelay: '0.6s' }}>GRANTING ACCESS TO VAULT</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
