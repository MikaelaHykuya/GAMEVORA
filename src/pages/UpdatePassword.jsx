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
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-emerald-400']

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return showToast('Passwords do not match!', 'warning')
    if (password.length < 6) return showToast('Password too weak!', 'warning')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { showToast(error.message, 'error') } else { showToast('Password updated!', 'success'); navigate('/profile') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6">
      <Helmet>
        <title>Update Password | GVR</title>
        <meta name="description" content="Perbarui password akun Vault kamu." />
      </Helmet>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in relative">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-600/20">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Update Password</h1>
          <p className="text-gray-500 text-sm mt-2">Buat password baru untuk akun kamu</p>
        </div>

        <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2">Password Baru</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 pr-12 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700"
                  placeholder="Min 6 characters" required />
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
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strengthColors[strength]}`} style={{ width: `${(strength / 5) * 100}%` }} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wider ${strength >= 3 ? 'text-green-400' : strength >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2">Konfirmasi Password</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 pr-12 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700"
                  placeholder="Confirm password" required />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                  {showConfirm ? (
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
              {confirm.length > 0 && password !== confirm && (
                <p className="text-[10px] text-red-400 mt-1.5 font-bold">Passwords do not match</p>
              )}
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300 disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  UPDATING
                </span>
              ) : 'Update Password'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/profile" className="text-[10px] text-gray-600 hover:text-gray-400 transition font-bold">← Kembali ke Profile</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
