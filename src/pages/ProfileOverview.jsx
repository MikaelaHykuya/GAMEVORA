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

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Vault Hunter'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const navCards = [
    { to: '/profile/collection', label: 'My Games', count: libraryCount, bg: 'from-purple-600 to-purple-500', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { to: '/profile/wishlist', label: 'Wishlist', count: null, bg: 'from-pink-600 to-pink-500', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' },
    { to: '/profile/orders', label: 'Orders', count: orderCount, bg: 'from-blue-600 to-blue-500', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { to: '/profile/settings', label: 'Settings', count: null, bg: 'from-yellow-600 to-yellow-500', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { to: '/affiliate', label: 'Kode Voucher', count: null, bg: 'from-green-600 to-emerald-500', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ]

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>GVR - Profile</title><meta name="description" content="Your GameVora profile overview" /></Helmet>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] bg-blue-600/5 rounded-full blur-[100px] animate-float" />
      </div>

      <Navbar />
      <BottomNav />

      <main className="pt-28 px-4 md:px-6 max-w-5xl mx-auto pb-32 relative">

        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 via-transparent to-transparent rounded-[32px]" />
          <div className="relative bg-zinc-900/60 border border-white/[0.04] rounded-[32px] overflow-hidden backdrop-blur-xl">
            <div className="h-32 md:h-40 bg-gradient-to-r from-purple-900/40 via-blue-900/20 to-purple-900/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.1),transparent_70%)]" />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-900 to-transparent" />
            </div>
            <div className="px-6 md:px-8 pb-6 -mt-16 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex items-end gap-5">
                  <div className="relative">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-[3px] border-zinc-800 shadow-[0_0_30px_rgba(168,85,247,0.3)] bg-zinc-800">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-xl font-black">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-[3px] border-zinc-900 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-ping absolute" />
                      <div className="w-2 h-2 bg-green-400 rounded-full relative" />
                    </div>
                  </div>
                  <div className="pb-1">
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{displayName}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {profile?.username && (
                        <span className="text-purple-400 text-[10px] font-black uppercase tracking-widest">@{profile.username}</span>
                      )}
                      <span className="text-gray-600 text-[9px] font-black uppercase tracking-widest hidden md:inline">|</span>
                      <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest">{user?.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-800/80 border border-white/[0.04] rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
                    <div className="flex">
                      {[1,2,3].map(i => (
                        <div key={i} className={`w-5 h-5 rounded-full border-2 border-zinc-800 -ml-1.5 first:ml-0 bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center`}>
                          <span className="text-[6px] font-black">♦</span>
                        </div>
                      ))}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Lv.{Math.min(libraryCount + 1, 50)}</span>
                  </div>
                  <button onClick={() => navigate('/profile/settings')}
                    className="bg-zinc-800/80 border border-white/[0.04] hover:bg-zinc-700/80 transition-all p-2.5 rounded-2xl">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          {[
            { label: 'Orders', value: orderCount, color: 'from-purple-600 to-purple-500', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { label: 'Spending', value: formatRupiah(totalSpending), color: 'from-blue-600 to-blue-500', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Collection', value: libraryCount, color: 'from-green-600 to-green-500', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-5 hover:border-white/[0.08] hover:-translate-y-0.5 transition-all group relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.color} opacity-5 rounded-full blur-[30px] -mr-8 -mt-8`} />
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{s.label}</p>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center opacity-80`}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                </div>
              </div>
              <p className={`text-2xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {navCards.map(card => (
            <Link key={card.to} to={card.to}
              className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-4 flex items-center gap-4 hover:border-white/[0.08] hover:-translate-y-0.5 transition-all group relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-r ${card.bg} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.bg} flex items-center justify-center flex-shrink-0 relative`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <div className="flex-1 min-w-0 relative">
                <p className="text-sm font-black uppercase tracking-tight">{card.label}</p>
                {card.count !== null && (
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{card.count} items</p>
                )}
              </div>
              <svg className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors flex-shrink-0 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
