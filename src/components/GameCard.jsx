import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useAuth } from '../contexts/AuthContext'
import { formatRupiah } from '../lib/utils'
import useTilt from '../hooks/useTilt'

export default function GameCard({ game }) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { user } = useAuth()
  const tilt = useTilt(6)

  const priceFinal = game.discount_price > 0 ? game.discount_price : game.price
  const ratings = game.reviews || []
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : '0.0'

  return (
    <div ref={tilt.ref} onMouseMove={tilt.handleMouseMove} onMouseLeave={tilt.handleMouseLeave}
      className="tilt-card group bg-zinc-900/40 backdrop-blur-sm border border-white/[0.04] rounded-3xl overflow-hidden hover:border-purple-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-purple-600/15">
      <div
        className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-black/60 to-black/40 w-full cursor-pointer"
        onClick={() => { if (!user) { navigate('/login'); return }; navigate(`/detail/${game.id}`) }}
      >
        <img
          src={game.thumbnail}
          loading="lazy"
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-[1200ms] ease-out"
          alt={game.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030303]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {game.discount_price > 0 && (
          <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-red-600 to-red-500 text-white text-[8px] font-black px-3 py-1.5 rounded-xl tracking-wider shadow-lg shadow-red-600/30">
            SALE
          </div>
        )}

        {game.discount_price > 0 && (
          <div className="absolute top-4 right-4 z-10 bg-red-500/20 backdrop-blur-xl border border-red-500/30 text-red-400 text-[8px] font-black px-2 py-1 rounded-lg">
            -{Math.round((1 - game.discount_price / game.price) * 100)}%
          </div>
        )}

        <div className="absolute top-14 right-4 z-10 flex flex-col gap-2">
          <button onClick={(e) => { e.stopPropagation(); toggleWishlist(game.id) }}
            className="p-2 rounded-xl backdrop-blur-xl border border-white/10 shadow-lg transition-all hover:scale-110 hover:shadow-purple-500/20"
            style={{ backgroundColor: isInWishlist(game.id) ? 'rgba(168, 85, 247, 0.6)' : 'rgba(0,0,0,0.5)' }}>
            <svg className="w-4 h-4" fill={isInWishlist(game.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"
              color={isInWishlist(game.id) ? '#fff' : '#fff'}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[7px] font-black text-purple-400/80 uppercase tracking-[0.25em]">{game.genre || 'License'}</span>
          <div className="flex items-center gap-1.5">
            {game.sold_count > 0 && (
              <span className="text-[7px] font-black text-gray-500">{game.sold_count.toLocaleString('id-ID')} terjual</span>
            )}
            <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/10">
              <svg className="w-2 h-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-[8px] font-black text-yellow-300">{avgRating}{ratings.length > 0 ? ` (${ratings.length})` : ''}</span>
            </div>
          </div>
        </div>
        {game.is_trending && (
          <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-[7px] font-black px-2.5 py-1 rounded-lg mb-2 w-fit uppercase tracking-wider shadow-lg shadow-red-600/20">
            Trending
          </div>
        )}
        <h3 className="font-black text-sm uppercase tracking-tight line-clamp-1 mb-3 group-hover:text-purple-300 transition-colors duration-300">{game.title}</h3>
        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-xl font-black tracking-tight">{formatRupiah(priceFinal)}</span>
          {game.discount_price > 0 && (
            <span className="text-[10px] text-gray-600 line-through">{formatRupiah(game.price)}</span>
          )}
        </div>
        <button
          onClick={() => addToCart(game.id)}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-wider hover:shadow-lg hover:shadow-purple-600/30 hover:from-purple-500 hover:to-purple-400 transition-all duration-300 active:scale-[0.98]"
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}
