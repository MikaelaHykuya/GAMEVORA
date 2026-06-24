import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col">
      <Helmet>
        <title>404 - Not Found | GVR</title>
        <meta name="description" content="Halaman yang kamu cari tidak ditemukan." />
      </Helmet>

      <Navbar />
      <BottomNav />

      <main className="flex-1 flex items-center justify-center px-6 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px]" />
        </div>

        <div className="text-center relative">
          <div className="w-20 h-20 bg-zinc-900/60 border border-white/[0.06] rounded-3xl flex items-center justify-center mx-auto mb-8">
            <svg className="w-9 h-9 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">404</h1>
          <p className="text-gray-400 text-sm md:text-base mt-4 mb-8 max-w-md mx-auto">
            Halaman yang kamu cari tidak ditemukan atau telah dipindahkan.
          </p>
          <Link to="/"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Kembali ke Home
          </Link>
        </div>
      </main>
    </div>
  )
}
