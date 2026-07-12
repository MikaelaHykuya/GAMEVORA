import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { supabase } from '../lib/supabase'
import { getAvatarUrl } from '../lib/utils'
import InboxModal from './InboxModal'

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const { cartCount, openCart } = useCart()
  const { wishlistCount } = useWishlist()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [showNotif, setShowNotif] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef(null)
  const [showInbox, setShowInbox] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const notifRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('vault_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count }) => setNotifCount(count || 0))
  }, [user])

  useEffect(() => {
    if (!user) return
    const channel = supabase.channel('notif_count_' + user.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vault_notifications',
        filter: 'user_id=eq.' + user.id
      }, () => {
        supabase
          .from('vault_notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
          .then(({ count }) => setNotifCount(count || 0))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false)
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setSearchOpen(false)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(s => !s); if (!searchOpen) setTimeout(() => searchRef.current?.querySelector('input')?.focus(), 100) }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => { document.removeEventListener("mousedown", handleClickOutside); document.removeEventListener("keydown", handleKeyDown) }
  }, [searchOpen])

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/store', label: 'Store' },
    { to: '/dashboard', label: 'Vault' },
    { to: '/faq', label: 'FAQ' },
    { to: '/request', label: 'Request' },
    { to: '/giveaways', label: 'Giveaway' },
    { to: '/friends', label: 'Friends' },
    { to: '/playlist', label: 'Playlist' },
  ]

  return (
    <div className="fixed top-0 md:top-6 left-0 right-0 z-[1500] flex justify-center pointer-events-none px-4 md:px-8 lg:px-12">
      <nav className="pointer-events-auto w-full max-w-7xl floating-dock md:rounded-[32px] rounded-b-3xl px-4 md:px-6 flex items-center h-[72px] md:h-[80px] transition-all duration-500">
        <div className="flex items-center justify-between w-full min-w-0 gap-2">
          <div className="flex items-center gap-4 lg:gap-8 text-left min-w-0">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity group shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              </div>
              <span className="text-xl md:text-2xl font-black italic tracking-tighter text-white uppercase leading-none hidden sm:block shrink-0">GVR</span>
            </Link>
            <div className="hidden lg:flex items-center gap-0.5 lg:gap-1.5 text-[9px] lg:text-[10px] font-black uppercase tracking-wider lg:tracking-[0.25em] overflow-x-auto no-scrollbar pr-4 mask-fade-right">
              {navLinks.map(link => {
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.label}
                    to={link.to}
                    className={`relative px-2 lg:px-3 xl:px-5 py-2 lg:py-2.5 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? 'text-white bg-white/10 shadow-inner'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 hover:-translate-y-0.5'
                    }`}
                  >
                    {link.label}
                    {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-[2px]" />}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden relative p-2.5 active-scale hover:bg-white/5 rounded-2xl transition-colors focus:outline-none shrink-0">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <div className="relative" ref={searchRef}>
            <div className={`flex items-center transition-all duration-300 ${searchOpen ? 'w-64' : 'w-9'}`}>
              {searchOpen ? (
                <form onSubmit={e => { e.preventDefault(); if (searchQuery.trim()) { navigate(`/store?search=${encodeURIComponent(searchQuery.trim())}`); setSearchOpen(false); setSearchQuery('') } }} className="flex items-center w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari game... (Ctrl+K)"
                    autoFocus
                    className="w-full bg-zinc-800/80 border border-white/[0.08] rounded-2xl pl-4 pr-10 py-2.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-600"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </form>
              ) : (
                <button onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.querySelector('input')?.focus(), 100) }}
                  className="p-2.5 active-scale hover:bg-white/5 rounded-2xl transition-colors group" title="Search (Ctrl+K)">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowInbox(true)} className={`relative p-2.5 active-scale rounded-2xl transition-colors focus:outline-none ${showNotif ? 'bg-white/10' : 'hover:bg-white/5'}`}>
              <svg className={`w-5 h-5 transition-colors ${showNotif ? 'text-white' : 'text-gray-400 hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[7px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-lg shadow-red-500/30 animate-fade-in">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
          </div>
          <InboxModal open={showInbox} onClose={() => setShowInbox(false)} />
          <Link to="/profile/wishlist" className="relative p-2.5 active-scale hover:bg-white/5 rounded-2xl transition-colors">
            <svg className="w-5 h-5 text-gray-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-pink-500 to-pink-600 text-white text-[7px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-lg shadow-pink-500/30 animate-fade-in">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
          </Link>
          <button onClick={openCart} className="relative p-2.5 active-scale hover:bg-white/5 rounded-2xl transition-colors">
            <svg className="w-5 h-5 text-gray-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[7px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-lg shadow-red-500/30 animate-fade-in">
                {cartCount}
              </span>
            )}
          </button>
          {user ? (
            <div className="relative" ref={profileRef}>
              <button onClick={() => setShowProfileMenu(s => !s)} className="flex items-center gap-2.5 active-scale pl-2 pr-3 py-1.5 rounded-full hover:bg-white/5 transition-all">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 border-2 border-white/5 overflow-hidden shadow-lg hover:border-purple-400/50 transition-all duration-300">
                  <img
                    src={profile?.avatar_url || getAvatarUrl(user.email)}
                    className="w-full h-full object-cover"
                    alt="avatar"
                  />
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest hover:text-gray-300 transition-colors">
                    {profile?.full_name || 'Hunter'}
                  </span>
                  <span className="text-[6px] text-purple-500 font-bold uppercase mt-0.5 tracking-wider">My Vault</span>
                </div>
              </button>
              <div className={`absolute right-0 top-full mt-4 w-56 transition-all duration-300 origin-top-right ${showProfileMenu ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}>
                <div className="glass-card-premium rounded-[32px] overflow-hidden p-2 shadow-2xl border border-white/[0.08]">
                  <div className="px-4 py-3 border-b border-white/[0.04] mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 p-0.5">
                      <img src={profile?.avatar_url || getAvatarUrl(user.email)} className="w-full h-full rounded-full object-cover" alt="avatar" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{profile?.full_name || 'Hunter'}</p>
                      <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link to="/dashboard" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-xs font-bold text-gray-300 hover:text-white">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    My Vault
                  </Link>
                  <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-xs font-bold text-gray-300 hover:text-white">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Dashboard
                  </Link>
                  <Link to="/profile/collection" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-xs font-bold text-gray-300 hover:text-white">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    Collection
                  </Link>
                  <Link to="/profile/wishlist" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-xs font-bold text-gray-300 hover:text-white">
                    <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    Wishlist
                  </Link>
                  <Link to="/profile/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors text-xs font-bold text-gray-300 hover:text-white">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                    Settings
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-500/10 transition-colors text-xs font-bold text-red-400 hover:text-red-300">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="h-px bg-white/[0.06] my-1" />
                  <button onClick={() => { setShowProfileMenu(false); signOut() }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-500/10 transition-colors text-xs font-bold text-red-400 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/login" className="ml-2 flex items-center justify-center px-6 py-2.5 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-gray-200 hover:-translate-y-0.5 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>

    {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden pointer-events-auto" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}

      <div ref={mobileMenuRef} className={`fixed top-[80px] left-0 right-0 z-50 md:hidden pointer-events-auto transition-all duration-300 ease-out transform ${mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className="glass-card-premium mx-4 rounded-2xl p-3 border border-white/[0.06] shadow-2xl space-y-1">
          {navLinks.map(link => {
            const isActive = location.pathname === link.to
            return (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active-scale ${
                  isActive
                    ? 'text-purple-300 bg-purple-500/10'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active-scale ${
                location.pathname === '/admin'
                  ? 'text-red-300 bg-red-500/10'
                  : 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
              }`}
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
