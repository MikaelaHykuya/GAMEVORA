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
          navigate('/store')
        }, 1500)
      }
    } catch {
        showToast('Network Error', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6">
      <Helmet>
        <title>Login | GVR</title>
        <meta name="description" content="Login untuk mengakses Vault digital kamu." />
      </Helmet>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in relative">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-600/20">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Sign In</h1>
          <p className="text-gray-500 text-sm mt-2">Masuk ke akun Vault kamu</p>
        </div>

        <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700"
                placeholder="your@email.com" required />
            </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Password</label>
                  <Link to="/forgot-password" className="text-[9px] text-purple-400 hover:text-purple-300 transition font-bold">Lupa?</Link>
                </div>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 pr-12 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700"
                    placeholder="Enter password" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
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
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300 disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  VERIFYING
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-gray-500">
              Belum punya akun?{' '}
              <Link to="/register" className="text-purple-400 hover:text-white transition font-bold">Daftar</Link>
            </p>
            <Link to="/store" className="block text-[10px] text-gray-600 hover:text-gray-400 transition font-bold">← Kembali ke Store</Link>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-6 bg-[#050505] overflow-hidden font-mono">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMzMzMiLz4KPC9zdmc+')] opacity-20 pointer-events-none" />
          
          <div className="relative text-center w-full max-w-2xl z-10">
            <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter text-[#fef08a] uppercase mb-2 animate-pulse relative"
                style={{ textShadow: '4px 4px 0px #ef4444, -4px -4px 0px #06b6d4' }}>
              <span className="absolute inset-0 animate-glitch text-[#fef08a] opacity-80" style={{ textShadow: '4px 4px 0px #ef4444' }}>BREACHING</span>
              BREACHING
            </h1>
            <h2 className="text-2xl md:text-5xl font-black italic tracking-widest text-[#06b6d4] uppercase mb-12 animate-pulse"
                style={{ textShadow: '2px 2px 0px #ef4444' }}>
              Mainframe...
            </h2>
            <div className="w-full bg-gray-900 h-6 border-2 border-[#fef08a] p-1 relative overflow-hidden mb-8">
              <div className="h-full bg-[#fef08a] w-[85%] animate-[pulse_0.2s_infinite]" />
              <div className="absolute top-0 bottom-0 left-0 w-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.8)_50%,transparent_100%)] animate-shimmer" />
            </div>
            <div className="text-left space-y-3 text-[#06b6d4] text-[10px] md:text-sm font-bold opacity-80 uppercase tracking-widest">
              <p>_&gt; ESTABLISHING SECURE CONNECTION [OK]</p>
              <p>_&gt; BYPASSING FIREWALL <span className="animate-pulse text-[#ef4444] ml-2">ERROR RETRYING...</span></p>
              <p>_&gt; DECRYPTING NEURAL LINK [OK]</p>
              <p className="animate-pulse text-[#fef08a]">_&gt; AUTHENTICATING USER IDENTITY...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
