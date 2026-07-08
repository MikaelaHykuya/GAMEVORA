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
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6">
      <Helmet>
        <title>Reset Password | GVR</title>
        <meta name="description" content="Reset password akun Vault kamu." />
      </Helmet>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-600/20">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            {sent ? 'Cek Email Kamu' : 'Reset Password'}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {sent ? 'Link reset password sudah dikirim ke email kamu' : 'Masukkan email untuk reset password'}
          </p>
        </div>

        <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
          {!sent ? (
            <form onSubmit={handleSend} className="space-y-5">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700"
                  placeholder="your@email.com" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300 disabled:opacity-50">
                {loading ? 'MENGIRIM...' : 'Kirim Link Reset'}
              </button>
            </form>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-black uppercase tracking-tight text-gray-300">Email Terkirim</p>
              <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                Kami telah mengirim link reset password ke <span className="text-purple-400 font-bold">{email}</span>
              </p>
              <p className="text-[9px] text-gray-600 mt-4">Tidak menerima email? Cek folder spam atau</p>
              <button onClick={() => setSent(false)}
                className="mt-2 text-[9px] text-purple-400 font-black uppercase tracking-widest hover:text-purple-300 transition-all">
                Kirim ulang →
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="text-[10px] text-gray-600 hover:text-gray-400 transition font-bold">← Kembali ke Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
