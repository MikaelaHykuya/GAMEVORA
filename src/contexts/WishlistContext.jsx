import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [wishlistCount, setWishlistCount] = useState(0)
  const [wishlistItems, setWishlistItems] = useState([])
  const [wishlistGameIds, setWishlistGameIds] = useState(new Set())

  const fetchWishlistCount = useCallback(async () => {
    if (!user) return
    const { count } = await supabase
      .from('wishlist')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    setWishlistCount(count || 0)
  }, [user])

  const fetchWishlistItems = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('wishlist')
      .select('id, games(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setWishlistItems(data || [])
    setWishlistGameIds(new Set((data || []).map(item => item.games?.id).filter(Boolean)))
  }, [user])

  useEffect(() => {
    if (!user) { setWishlistCount(0); setWishlistItems([]); setWishlistGameIds(new Set()); return }
    fetchWishlistCount()
    fetchWishlistItems()
    const channel = supabase.channel('wishlist_realtime_' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist', filter: 'user_id=eq.' + user.id }, () => {
        fetchWishlistCount()
        fetchWishlistItems()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetchWishlistCount, fetchWishlistItems])

  const addToWishlist = useCallback(async (gameId) => {
    if (!user) { navigate('/login'); return }
    const { error } = await supabase.from('wishlist').insert([{ user_id: user.id, game_id: gameId }])
    if (error) {
      if (error.code === '23505') return
      return showToast('Gagal: ' + error.message, 'error')
    }
    fetchWishlistCount()
    fetchWishlistItems()
  }, [user, fetchWishlistCount, fetchWishlistItems])

  const removeFromWishlist = useCallback(async (gameId) => {
    await supabase.from('wishlist').delete().eq('user_id', user.id).eq('game_id', gameId)
    fetchWishlistCount()
    fetchWishlistItems()
  }, [user, fetchWishlistCount, fetchWishlistItems])

  const isInWishlist = useCallback((gameId) => {
    return wishlistGameIds.has(gameId)
  }, [wishlistGameIds])

  const toggleWishlist = useCallback(async (gameId) => {
    if (isInWishlist(gameId)) {
      await removeFromWishlist(gameId)
    } else {
      await addToWishlist(gameId)
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist])

  return (
    <WishlistContext.Provider value={{
      wishlistCount, wishlistItems, wishlistGameIds,
      fetchWishlistCount, fetchWishlistItems,
      addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)
