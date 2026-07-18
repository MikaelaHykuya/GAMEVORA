import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'

export default function ForgotPassword() {
  const { showToast } = useToast()
  useEffect(() => { document.body.classList.add('auth-page'); return () => document.body.classList.remove('auth-page') }, [])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    if (error) { showToast(error.message, 'error') } else { setSent(true) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <Helmet>
        <title>GVR | Key Recovery</title>
        <meta name="description" content="Reset your Vault access key." />
      </Helmet>

      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-cyan-500/10 blur-[1px]" />
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in relative z-10">
        {/* Terminal Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse" />
            <div className="w-16 h-16 bg-zinc-900 border border-cyan-500/50 rounded-2xl flex items-center justify-center relative shadow-[0_0_30px_rgba(34,211,238,0.2)]">
              <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
            {sent ? 'Transmission Sent' : 'Lost Key Recovery'}
          </h1>
          <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.2em]">
            {sent ? 'Check Comms Channel' : 'Identity Verification Required'}
          </p>
        </div>

        {/* Cyberpunk Form Card */}
        <div className="relative bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
          
          {!sent ? (
            <form onSubmit={handleSend} className="space-y-6">
              <div className="group relative">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2 flex items-center gap-2">
                  <svg className="w-3 h-3 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Operative Email
                </label>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500 pointer-events-none" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus
                  className="relative w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-cyan-500/50 focus:bg-cyan-950/10 transition-all text-sm font-mono text-white placeholder:text-gray-700 shadow-inner"
                  placeholder="operative@network.gvr" required />
              </div>

              <button type="submit" disabled={loading}
                className="group relative w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-[0.2em] active-scale hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all duration-300 disabled:opacity-50 overflow-hidden mt-4 border border-white/10">
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-shimmer" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? 'TRANSMITTING...' : 'Transmit Recovery Link'}
                  {!loading && <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                </span>
              </button>
            </form>
          ) : (
            <div className="text-center py-6 animate-fade-up">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-2 border-dashed border-cyan-500/30 rounded-full animate-spin-slow" />
                <div className="absolute inset-2 border-2 border-cyan-400 rounded-full animate-ping opacity-20" />
                <div className="w-full h-full rounded-full bg-cyan-500/10 flex items-center justify-center relative backdrop-blur-md">
                  <svg className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-black uppercase tracking-tight text-white mb-2">Signal Confirmed</p>
              <p className="text-[10px] font-mono text-gray-500 leading-relaxed mb-6">
                Recovery instructions transmitted to: <br/>
                <span className="text-cyan-400 font-bold inline-block mt-1 bg-cyan-500/10 px-2 py-1 rounded">{email}</span>
              </p>
              
              <div className="pt-6 border-t border-white/5 space-y-3">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">Signal lost? Check spam filters or</p>
                <button onClick={() => setSent(false)}
                  className="text-[9px] text-cyan-400 font-black uppercase tracking-widest hover:text-cyan-300 transition-colors border-b border-cyan-400/30 hover:border-cyan-300 pb-0.5">
                  Retransmit Signal
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-[9px] font-black text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-widest group/back">
              <svg className="w-3 h-3 group-hover/back:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Abort & Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
