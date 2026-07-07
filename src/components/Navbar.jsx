import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
  
  const [showNotif, setShowNotif] = useState(false)
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
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
    <nav className="fixed top-0 w-full z-[1500] glass-nav flex items-center">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between w-full">
        <div className="flex items-center gap-8 text-left">
          <Link to="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            <span className="text-2xl font-black italic tracking-tighter text-gradient uppercase leading-none">GVR</span>
          </Link>
          <div className="hidden md:flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em]">
            {navLinks.map(link => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`relative px-4 py-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'text-purple-300 bg-purple-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className={`relative px-4 py-2 rounded-full transition-all duration-300 ${
                  location.pathname === '/admin'
                    ? 'text-red-300 bg-red-500/10'
                    : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                }`}
              >
                Admin
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden relative p-2.5 active-scale hover:bg-white/5 rounded-2xl transition-colors focus:outline-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
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
              <div className={`absolute right-0 top-full mt-2 w-44 transition-all duration-200 ${showProfileMenu ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-1'}`}>
                <div className="glass-card-premium rounded-2xl p-2 shadow-2xl border border-white/[0.06] space-y-0.5">
                  <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-all active-scale">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Dashboard
                  </Link>
                  <Link to="/profile/collection" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-all active-scale">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Collection
                  </Link>
                  <Link to="/profile/wishlist" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-all active-scale">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Wishlist
                  </Link>
                  <Link to="/profile/orders" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-all active-scale">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Orders
                  </Link>
                  <Link to="/friends" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-all active-scale">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Friends
                  </Link>
                  <Link to="/playlist" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-all active-scale">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    Playlist
                  </Link>
                  <Link to="/profile/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-all active-scale">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                    Settings
                  </Link>
                  <div className="h-px bg-white/[0.06] my-1" />
                  <button onClick={signOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all active-scale">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/login" className="bg-white text-black text-[10px] font-black px-6 py-2.5 rounded-full uppercase active-scale hover:bg-purple-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-purple-600/20">
              Login
            </Link>
          )}
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}

      <div ref={mobileMenuRef} className={`fixed top-[calc(80px+var(--sat))] left-0 right-0 z-50 md:hidden transition-all duration-300 ease-out transform ${mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
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
    </nav>
  )
}
