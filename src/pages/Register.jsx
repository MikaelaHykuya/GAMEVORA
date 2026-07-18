import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'

export default function Register() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  useEffect(() => { document.body.classList.add('auth-page'); return () => document.body.classList.remove('auth-page') }, [])
  
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
    setLoading(true)
    try {
      if (password !== confirmPassword) throw new Error('Encryption Keys (Passwords) do not match!')
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: { full_name: fullName, username, role: 'user' },
        },
      })
      if (error) throw error
      if (data.user) {
        const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
        if (existing) {
          await supabase.from('profiles').update({ id: data.user.id, full_name: fullName, username, email }).eq('id', existing.id)
        } else {
          await supabase.from('profiles').insert({ id: data.user.id, full_name: fullName, username, role: 'user', email })
        }
      }
      showToast('Operative Enlisted! Please initialize connection (Login).', 'success')
      navigate('/login')
    } catch (err) {
      let msg = err.message || 'System Error'
      if (msg.includes('rate') || msg.includes('limit') || msg.includes('Email rate limit')) {
        msg = 'Connection overloaded. Await cooldown period.'
      } else if (msg.includes('already registered') || msg.includes('already been registered')) {
        msg = 'Identity already exists in mainframe. Proceed to Login.'
      } else if (msg.includes('valid email')) {
        msg = 'Invalid operative email format.'
      } else if (msg.includes('at least 6')) {
        msg = 'Encryption key must be at least 6 characters.'
      }
      showToast('Enlistment Failed: ' + msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6 relative overflow-hidden py-12 md:py-20">
      <Helmet>
        <title>GVR | Operative Enlistment</title>
        <meta name="description" content="Register as a new agent to access the Vault." />
      </Helmet>

      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-purple-500/10 blur-[1px]" />
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] animate-float" />
        <div className="absolute bottom-1/4 -left-32 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <div className="w-full max-w-[480px] relative z-10 animate-fade-up">
        {/* Terminal Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse" />
            <div className="w-16 h-16 bg-zinc-900 border border-purple-500/50 rounded-2xl flex items-center justify-center relative shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-2">
            New <span className="bg-gradient-to-r from-purple-400 to-cyan-500 bg-clip-text text-transparent">Operative</span>
          </h1>
          <p className="text-[10px] font-mono text-purple-400 uppercase tracking-[0.3em]">
            Database Registration
          </p>
        </div>

        {/* Cyberpunk Form Card */}
        <div className="relative bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 md:p-8 shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
          
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="group relative">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  Legal Name
                </label>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500 pointer-events-none" />
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="relative w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-500/50 focus:bg-cyan-950/10 transition-all text-xs font-mono text-white placeholder:text-gray-700 shadow-inner"
                  placeholder="John Doe" required />
              </div>
              
              {/* Username */}
              <div className="group relative">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  Codename
                </label>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500 pointer-events-none" />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="relative w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-500/50 focus:bg-cyan-950/10 transition-all text-xs font-mono text-white placeholder:text-gray-700 shadow-inner"
                  placeholder="agent_zero" required />
              </div>
            </div>

            {/* Email */}
            <div className="group relative">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Secure Email
              </label>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500 pointer-events-none" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="relative w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-cyan-500/50 focus:bg-cyan-950/10 transition-all text-sm font-mono text-white placeholder:text-gray-700 shadow-inner"
                placeholder="operative@network.gvr" required />
            </div>

            {/* Password */}
            <div className="group relative">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Encryption Key
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
                <div className="mt-3 bg-black/40 p-2 rounded-xl border border-white/5 flex items-center gap-3">
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
                <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Verify Key
              </label>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500 pointer-events-none" />
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 pr-12 outline-none focus:border-purple-500/50 focus:bg-purple-950/10 transition-all text-sm font-mono text-white placeholder:text-gray-700 shadow-inner"
                  placeholder="Re-enter sequence" required />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors p-1">
                  {showConfirm ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
            
            <button type="submit" disabled={loading}
              className="group relative w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-[0.2em] active-scale hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 disabled:opacity-50 overflow-hidden mt-6 border border-white/10">
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-shimmer" />
              {loading ? (
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ENLISTING...
                </span>
              ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Register Operative
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Already Enlisted?{' '}
              <Link to="/login" className="text-purple-400 hover:text-white transition-colors border-b border-purple-400/30 hover:border-white pb-0.5">Initialize Connection</Link>
            </p>
            <Link to="/store" className="inline-flex items-center gap-1.5 text-[9px] font-black text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-widest group/back">
              <svg className="w-3 h-3 group-hover/back:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Return to Hub
            </Link>
          </div>
        </div>
      </div>

      {/* Cyberpunk Loading Screen */}
      {loading && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-6 bg-[#050505]/95 backdrop-blur-3xl overflow-hidden font-mono">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none mix-blend-overlay" />
          <div className="absolute top-0 left-0 w-full h-[5px] bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,1)] animate-[scanLine_4s_linear_infinite]" />
          
          <div className="relative text-center w-full max-w-2xl z-10 animate-fade-in">
            <div className="w-24 h-24 rounded-full border-4 border-dashed border-purple-500/30 border-t-purple-400 animate-spin mx-auto mb-8 flex items-center justify-center relative">
               <div className="absolute inset-2 border-2 border-cyan-500/40 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
               <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" /></svg>
            </div>

            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-cyan-400 uppercase mb-2 animate-pulse relative drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
              <span className="absolute inset-0 animate-glitch text-cyan-400 opacity-80" style={{ textShadow: '4px 4px 0px #a855f7' }}>ESTABLISHING</span>
              ESTABLISHING
            </h1>
            <h2 className="text-xl md:text-3xl font-black italic tracking-[0.4em] text-purple-400 uppercase mb-12 animate-pulse drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
              Secure Link...
            </h2>
            
            <div className="w-full bg-black/50 h-8 border border-purple-500/50 rounded-lg p-1 relative overflow-hidden mb-8 shadow-inner">
              <div className="h-full bg-purple-500 rounded w-[45%] animate-[pulse_0.2s_infinite] shadow-[0_0_15px_rgba(168,85,247,0.8)] transition-all duration-1000 ease-out" />
              <div className="absolute top-0 bottom-0 left-0 w-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-shimmer" />
            </div>
            
            <div className="text-left space-y-3 text-purple-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] bg-black/40 p-6 rounded-2xl border border-white/5 inline-block mx-auto">
              <p className="animate-fade-up" style={{ animationDelay: '0s' }}>_&gt; GENERATING ENCRYPTION KEYS <span className="text-cyan-400">[DONE]</span></p>
              <p className="animate-fade-up" style={{ animationDelay: '0.3s' }}>_&gt; REGISTERING CODENAME <span className="text-cyan-400">[DONE]</span></p>
              <p className="animate-fade-up" style={{ animationDelay: '0.6s' }}>_&gt; SECURING DATABASE ENTRY <span className="animate-pulse text-yellow-400 ml-2">WRITING...</span></p>
              <p className="animate-pulse text-cyan-400 mt-4 animate-fade-up" style={{ animationDelay: '0.9s' }}>_&gt; AWAITING MAINFRAME APPROVAL...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
