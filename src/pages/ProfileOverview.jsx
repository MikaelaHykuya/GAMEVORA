import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatRupiah, getAvatarUrl } from '../lib/utils'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import { Helmet } from 'react-helmet-async'

export default function ProfileOverview() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [libraryCount, setLibraryCount] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [totalSpending, setTotalSpending] = useState(0)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    init()
  }, [user])

  async function init() {
    const [approvedCountRes, approvedLib, allLibRes] = await Promise.all([
      supabase.from('library').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'approved'),
      supabase.from('library').select('id, games(price, discount_price)').eq('user_id', user.id).eq('status', 'approved'),
      supabase.from('library').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    setLibraryCount(approvedCountRes.count || 0)
    setOrderCount(allLibRes.count || 0)
    setTotalSpending(
      (approvedLib.data || []).reduce((acc, curr) => acc + (Number(curr.games?.discount_price || curr.games?.price) || 0), 0)
    )
  }

  const navCards = [
    { to: '/profile/collection', label: 'My Games', count: libraryCount, bg: 'from-purple-600 to-purple-500', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { to: '/profile/wishlist', label: 'Wishlist', count: null, bg: 'from-pink-600 to-pink-500', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' },
    { to: '/profile/orders', label: 'Orders', count: orderCount, bg: 'from-blue-600 to-blue-500', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { to: '/profile/settings', label: 'Settings', count: null, bg: 'from-yellow-600 to-yellow-500', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { to: '/affiliate', label: 'Affiliate', count: null, bg: 'from-green-600 to-emerald-500', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ]

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>GVR - Profile</title><meta name="description" content="Your GameVora profile overview" /></Helmet>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-[250px] h-[250px] bg-blue-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <Navbar />
      <BottomNav />

      <main className="pt-28 px-4 md:px-6 max-w-5xl mx-auto pb-32 relative">
        <div className="mb-10 text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 p-0.5 bg-gradient-to-r from-purple-600 to-blue-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            <img
              src={profile?.avatar_url || getAvatarUrl(user?.email, 256)}
              className="w-full h-full rounded-full object-cover border-2 border-black"
              alt="avatar"
            />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">{profile?.full_name || user?.email?.split('@')[0]}</h1>
          {profile?.username && <p className="text-purple-400 text-[10px] font-black uppercase tracking-widest mt-1">@{profile.username}</p>}
          <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mt-1">{user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { label: 'Orders', value: orderCount, color: 'from-purple-600 to-purple-500', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { label: 'Spending', value: formatRupiah(totalSpending), color: 'from-blue-600 to-blue-500', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Collection', value: libraryCount, color: 'from-green-600 to-green-500', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-5 text-center hover:border-white/[0.08] transition-all group">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-3`}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </div>
              <p className={`text-2xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {navCards.map(card => (
            <Link key={card.to} to={card.to}
              className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-5 flex items-center gap-4 hover:border-white/[0.08] hover:-translate-y-0.5 transition-all group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.bg} flex items-center justify-center flex-shrink-0`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black uppercase tracking-tight">{card.label}</p>
                {card.count !== null && (
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{card.count} items</p>
                )}
              </div>
              <svg className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <button onClick={signOut}
            className="inline-flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all duration-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </main>
    </div>
  )
}
