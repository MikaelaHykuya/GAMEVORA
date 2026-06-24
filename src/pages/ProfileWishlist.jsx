import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useCart } from '../contexts/CartContext'
import { formatRupiah } from '../lib/utils'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import { Helmet } from 'react-helmet-async'

export default function ProfileWishlist() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { wishlistItems, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()

  if (!user) { navigate('/login'); return null }

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>GVR - Wishlist</title><meta name="description" content="Your wishlisted games" /></Helmet>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-[250px] h-[250px] bg-pink-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <Navbar />
      <BottomNav />

      <main className="pt-28 px-4 md:px-6 max-w-7xl mx-auto pb-32 relative">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => navigate('/profile')} className="p-2.5 bg-white/[0.05] rounded-2xl hover:bg-white/10 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7 7l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Wishlist</h1>
        </div>

        <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-5 space-y-3">
          {wishlistItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              </div>
              <p className="text-sm text-gray-500 font-bold">Wishlist is empty</p>
            </div>
          ) : (
            wishlistItems.map(item => {
              const game = item.games
              if (!game) return null
              const price = game.discount_price > 0 ? game.discount_price : game.price
              return (
                <div key={item.id} className="bg-zinc-900/60 border border-white/[0.04] p-4 rounded-2xl flex items-center justify-between hover:border-white/[0.08] transition-all">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img src={game.thumbnail} className="w-11 h-11 rounded-xl object-cover border border-white/5 flex-shrink-0" alt={game.title} />
                    <div className="min-w-0">
                      <h4 className="text-sm font-black uppercase leading-tight truncate">{game.title}</h4>
                      <p className="text-[9px] text-purple-400 font-bold mt-0.5">{formatRupiah(price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <button onClick={() => { addToCart(game.id); removeFromWishlist(game.id) }}
                      className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl text-[8px] font-black uppercase hover:shadow-lg hover:shadow-purple-600/20 transition-all">
                      + Cart
                    </button>
                    <button onClick={() => removeFromWishlist(game.id)}
                      className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
