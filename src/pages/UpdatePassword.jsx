import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'

export default function UpdatePassword() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  useEffect(() => { document.body.classList.add('auth-page'); return () => document.body.classList.remove('auth-page') }, [])
  
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const getStrength = (pw) => {
    let score = 0
    if (pw.length >= 6) score++
    if (pw.length >= 10) score++
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
    if (/\d/.test(pw)) score++
    if (/[^a-zA-Z0-9]/.test(pw)) score++
    return score
  }

  const strength = getStrength(password)
  const strengthLabels = ['CRITICAL', 'WEAK', 'FAIR', 'GOOD', 'STRONG', 'UNBREAKABLE']
  const strengthColors = ['bg-red-500', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-cyan-400', 'bg-purple-500']

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return showToast('Encryption Keys do not match!', 'warning')
    if (password.length < 6) return showToast('Encryption Key too weak!', 'warning')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { showToast(error.message, 'error') } else { showToast('Security Key Synchronized!', 'success'); navigate('/profile') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <Helmet>
        <title>GVR | Key Synchronization</title>
        <meta name="description" content="Perbarui password akun Vault kamu." />
      </Helmet>

      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-cyan-500/10 blur-[1px]" />
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] animate-float" />
        <div className="absolute bottom-1/4 -left-32 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in relative z-10">
        {/* Terminal Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse" />
            <div className="w-16 h-16 bg-zinc-900 border border-purple-500/50 rounded-2xl flex items-center justify-center relative shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
            Key <span className="bg-gradient-to-r from-purple-400 to-cyan-500 bg-clip-text text-transparent">Update</span>
          </h1>
          <p className="text-[10px] font-mono text-purple-400 uppercase tracking-[0.3em]">
            Security Protocols Engaged
          </p>
        </div>

        {/* Cyberpunk Form Card */}
        <div className="relative bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password */}
            <div className="group relative">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                New Encryption Key
              </label>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500 pointer-events-none" />
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 pr-12 outline-none focus:border-purple-500/50 focus:bg-purple-950/10 transition-all text-sm font-mono text-white placeholder:text-gray-700 shadow-inner"
                  placeholder="Min 6 characters" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors p-1">
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
              {/* Encryption Strength Meter */}
              {password.length > 0 && (
                <div className="mt-3 bg-black/40 p-2 rounded-xl border border-white/5 flex items-center gap-3 animate-fade-in">
                  <span className="text-[7px] text-gray-500 font-mono uppercase">Lvl:</span>
                  <div className="flex-1 flex gap-1 h-1.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex-1 h-full rounded-full overflow-hidden bg-white/5">
                        <div className={`h-full w-full transition-all duration-300 ${i < strength ? strengthColors[strength] : 'opacity-0'}`} />
                      </div>
                    ))}
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${strengthColors[strength]?.replace('bg-', 'text-') || 'text-gray-500'}`}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="group relative">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Verify New Key
              </label>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500 pointer-events-none" />
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 pr-12 outline-none focus:border-cyan-500/50 focus:bg-cyan-950/10 transition-all text-sm font-mono text-white placeholder:text-gray-700 shadow-inner"
                  placeholder="Re-enter sequence" required />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors p-1">
                  {showConfirm ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {confirm.length > 0 && password !== confirm && (
                <p className="text-[9px] font-mono text-red-400 mt-2 flex items-center gap-1.5 animate-pulse">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Keys do not match
                </p>
              )}
            </div>
            
            <button type="submit" disabled={loading}
              className="group relative w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-[0.2em] active-scale hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 disabled:opacity-50 overflow-hidden mt-6 border border-white/10">
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-shimmer" />
              {loading ? (
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  SYNCHRONIZING...
                </span>
              ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Synchronize Key
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link to="/profile" className="inline-flex items-center gap-1.5 text-[9px] font-black text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-widest group/back">
              <svg className="w-3 h-3 group-hover/back:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Return to Hub
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
