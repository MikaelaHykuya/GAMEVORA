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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
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
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Wishlist</h1>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">{wishlistItems.length} saved items</p>
          </div>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl text-center py-24">
            <div className="relative w-16 h-16 mx-auto mb-5">
              <div className="absolute inset-0 bg-pink-600/10 rounded-2xl animate-ping" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center border border-pink-500/20">
                <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              </div>
            </div>
            <p className="text-sm text-gray-500 font-black uppercase tracking-tight">Wishlist is empty</p>
            <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest mt-2">Games you save will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {wishlistItems.map(item => {
              const game = item.games
              if (!game) return null
              const price = game.discount_price > 0 ? game.discount_price : game.price
              return (
                <div key={item.id} className="group bg-zinc-900/40 border border-white/[0.04] rounded-2xl overflow-hidden hover:border-white/[0.08] hover:-translate-y-1 transition-all duration-300">
                  <div className="aspect-[3/4] overflow-hidden relative">
                    <img src={game.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={game.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2 right-2">
                      <button onClick={() => removeFromWishlist(game.id)}
                        className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-red-500/30 transition-all border border-white/5">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <button onClick={() => { addToCart(game.id); removeFromWishlist(game.id) }}
                        className="w-full py-2 bg-gradient-to-r from-purple-600/80 to-purple-500/80 backdrop-blur-sm text-white rounded-xl font-black text-[7px] uppercase hover:shadow-lg transition-all">
                        + Add to Cart
                      </button>
                    </div>
                  </div>
                  <div className="p-3.5">
                    <span className="text-[7px] font-black text-pink-500 uppercase tracking-widest block mb-1 truncate">{game.genre || 'Game'}</span>
                    <h5 className="text-xs font-black uppercase leading-tight truncate">{game.title}</h5>
                    <p className="text-[9px] font-black text-purple-400 mt-1.5">{formatRupiah(price)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
