import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function ConfirmEmail() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (authLoading) return

    if (user) {
      setStatus('success')
      setMessage('Email berhasil dikonfirmasi! Akun kamu sudah aktif.')
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus('success')
        setMessage('Email berhasil dikonfirmasi! Akun kamu sudah aktif.')
      } else {
        const timer = setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          if (retrySession) {
            setStatus('success')
            setMessage('Email berhasil dikonfirmasi! Akun kamu sudah aktif.')
          } else {
            setStatus('error')
            setMessage('Link konfirmasi tidak valid atau sudah kedaluwarsa. Silakan daftar ulang.')
          }
        }, 3000)
        return () => clearTimeout(timer)
      }
    })
  }, [user, authLoading])

  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6">
      <Helmet>
        <title>Konfirmasi Email | GVR</title>
        <meta name="description" content="Konfirmasi email akun GVR." />
      </Helmet>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in relative">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-600/20">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            {status === 'loading' ? 'Memproses...' : status === 'success' ? 'Berhasil!' : 'Gagal'}
          </h1>
          <p className="text-gray-500 text-sm mt-2">{message || 'Memverifikasi konfirmasi email...'}</p>
        </div>

        <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 text-center">
          {status === 'loading' && (
            <div className="flex justify-center py-8">
              <span className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <button onClick={() => navigate('/store')}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300">
                Mulai Belanja
              </button>
              <p className="text-sm text-gray-500">
                <Link to="/login" className="text-purple-400 hover:text-white transition font-bold">Login</Link>
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <Link to="/register"
                className="block w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300">
                Daftar Ulang
              </Link>
              <Link to="/store" className="block text-[10px] text-gray-600 hover:text-gray-400 transition font-bold">← Kembali ke Store</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
