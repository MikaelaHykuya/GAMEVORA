import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [cartCount, setCartCount] = useState(0)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentSubtotal, setPaymentSubtotal] = useState(0)
  const [paymentUniqueCode, setPaymentUniqueCode] = useState(500)
  const [directBuyGame, setDirectBuyGame] = useState(null)

  const fetchCartCount = useCallback(async () => {
    if (!user) return
    const { count } = await supabase
      .from('cart')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    setCartCount(count || 0)
  }, [user])

  useEffect(() => {
    if (!user) { setCartCount(0); return }
    fetchCartCount()
    const channel = supabase.channel('cart_realtime_' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart', filter: 'user_id=eq.' + user.id }, fetchCartCount)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetchCartCount])

  const fetchCartItems = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('cart')
      .select('id, games(*)')
      .eq('user_id', user.id)
    if (error) console.error('Cart fetch error:', error)
    setCartItems(data || [])
    setLoading(false)
  }, [user])

  const addToCart = useCallback(async (gameId) => {
    if (!user) { navigate('/login'); return }
    const { error } = await supabase.from('cart').insert([{ user_id: user.id, game_id: gameId }])
    if (error) return showToast('Item already in vault!', 'warning')
    showToast('Added to Vault!', 'success')
    fetchCartCount()
  }, [user, fetchCartCount])

  const removeFromCart = useCallback(async (id) => {
    await supabase.from('cart').delete().eq('id', id)
    fetchCartItems()
    fetchCartCount()
  }, [fetchCartItems, fetchCartCount])

  const openCart = useCallback(() => {
    setCartOpen(true)
    fetchCartItems()
  }, [fetchCartItems])

  const closeCart = useCallback(() => {
    setCartOpen(false)
  }, [])

  const handleCheckout = useCallback(async () => {
    if (!user) { navigate('/login'); return }
    const { data: items } = await supabase.from('cart').select('games(price, discount_price)').eq('user_id', user.id)
    if (!items?.length) return showToast('Cart is empty!', 'warning')
    const subtotal = items.reduce((sum, i) => sum + (i.games?.discount_price || i.games?.price || 0), 0)
    const uniqueCode = 500
    setPaymentSubtotal(subtotal)
    setPaymentUniqueCode(uniqueCode)
    setPaymentAmount((Math.floor(subtotal / 1000) * 1000) + uniqueCode)
    setDirectBuyGame(null)
    setPaymentOpen(true)
    setCartOpen(false)
  }, [user, navigate, showToast])

  const handleDirectBuy = useCallback(async (game) => {
    if (!user) { navigate('/login'); return }
    const subtotal = game.discount_price > 0 ? game.discount_price : game.price
    const uniqueCode = 500
    setPaymentSubtotal(subtotal)
    setPaymentUniqueCode(uniqueCode)
    setPaymentAmount((Math.floor(subtotal / 1000) * 1000) + uniqueCode)
    setDirectBuyGame(game)
    setPaymentOpen(true)
    setCartOpen(false)
  }, [user, navigate])

  return (
    <CartContext.Provider value={{
      cartCount, cartOpen, cartItems, loading,
      fetchCartCount, fetchCartItems, addToCart, removeFromCart, openCart, closeCart,
      paymentOpen, setPaymentOpen, paymentAmount, paymentSubtotal, paymentUniqueCode, handleCheckout, handleDirectBuy, directBuyGame
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
